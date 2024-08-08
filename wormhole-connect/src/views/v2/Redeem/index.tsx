import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { TransferState } from '@wormhole-foundation/sdk';
import { makeStyles } from 'tss-react/mui';

import PageHeader from 'components/PageHeader';
import { Alignment } from 'components/Header';
import Button from 'components/v2/Button';
import config from 'config';
import { RouteContext } from 'contexts/RouteContext';
import useTrackTransfer from 'hooks/useTrackTransfer';
import PoweredByIcon from 'icons/PoweredBy';
import RouteOperator from 'routes/operator';
import { setRoute } from 'store/router';
import { displayAddress } from 'utils';
import { joinClass } from 'utils/style';
import TransactionDetails from 'views/v2/Redeem/TransactionDetails';

import type { RootState } from 'store';

const useStyles = makeStyles()((_theme) => ({
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    margin: 'auto',
    maxWidth: '650px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#C1BBF6',
    borderRadius: '8px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
}));

const Redeem = () => {
  const dispatch = useDispatch();
  const { classes } = useStyles();
  const theme = useTheme();

  const [isClaimInProgress, setIsClaimInProgress] = useState(false);

  // Start tracking changes in the transaction
  useTrackTransfer();

  const routeContext = React.useContext(RouteContext);

  const isTxAttested = useMemo(
    () =>
      routeContext.receipt &&
      routeContext.receipt.state >= TransferState.Attested,
    [routeContext.receipt],
  );

  const { transferComplete: isTxComplete, route: routeName } = useSelector(
    (state: RootState) => state.redeem,
  );

  const { recipient, receiveAmount, receivedTokenKey, toChain } = useSelector(
    (state: RootState) => state.redeem.txData,
  )!;

  const isAutomaticRoute = useMemo(() => {
    if (!routeName) {
      return false;
    }

    const route = RouteOperator.getRoute(routeName);

    if (!route) {
      return false;
    }

    return route.AUTOMATIC_DEPOSIT;
  }, [routeName]);

  // Overall loading indicator until the transaction is completed
  // const isLoading = useMemo(() => {
  //   if (isAutomaticRoute) {
  //     return !isTxComplete;
  //   }

  //   return !isTxComplete && isClaimInProgress;
  // }, [isAutomaticRoute, isClaimInProgress, isTxComplete]);

  const header = useMemo(() => {
    const defaults: { text: string; align: Alignment } = {
      text: '',
      align: 'left',
    };

    let headerConfig;

    if (typeof config.pageHeader === 'string') {
      headerConfig = { ...defaults, text: config.pageHeader };
    } else {
      headerConfig = { ...defaults, ...config.pageHeader };
    }

    return (
      <PageHeader
        title={headerConfig.text}
        align={headerConfig.align}
        showHamburgerMenu={config.showHamburgerMenu}
      />
    );
  }, []);

  // Header showing the status of the transaction
  const statusHeader = useMemo(() => {
    if (isTxComplete) {
      return <Stack>Transaction complete</Stack>;
    } else if (isTxAttested) {
      return (
        <Stack>{`${receiveAmount} ${receivedTokenKey} received at ${displayAddress(
          toChain,
          recipient,
        )}`}</Stack>
      );
    }

    return <Stack>Transaction submitted</Stack>;
  }, [
    isTxAttested,
    isTxComplete,
    receiveAmount,
    receivedTokenKey,
    recipient,
    toChain,
  ]);

  // Percent passed compared to the ETA
  const etaProgressPercent = useMemo(() => {
    return 40;
  }, []);

  const etaCircle = useMemo(() => {
    return (
      <>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {isTxComplete ? (
            <CheckCircleOutlineIcon
              htmlColor="#C1BBF6"
              sx={{ width: '120px', height: '120px' }}
            />
          ) : (
            <>
              <CircularProgress
                size="120px"
                sx={{
                  color: '#C1BBF6',
                }}
                variant="determinate"
                value={etaProgressPercent}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack>
                  <Typography
                    color={theme.palette.text.secondary}
                    fontSize={14}
                  >
                    ETA 10:00
                  </Typography>
                  <Typography fontSize={24}>07:35</Typography>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </>
    );
  }, [etaProgressPercent, isTxComplete]);

  const handleManualClaim = useCallback(async () => {
    setIsClaimInProgress(true);
    setIsClaimInProgress(false);
  }, []);

  // Main CTA button which has separate states for automatic and manual claims
  const actionButton = useMemo(() => {
    if (!isTxComplete && !isAutomaticRoute) {
      return (
        <Button
          className={classes.actionButton}
          disabled={isClaimInProgress}
          variant="primary"
          onClick={handleManualClaim}
        >
          {isClaimInProgress ? (
            <CircularProgress size={24} />
          ) : (
            <Typography textTransform="none">Claim</Typography>
          )}
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        className={classes.actionButton}
        onClick={() => {
          dispatch(setRoute('bridge'));
        }}
      >
        <Typography textTransform="none">Start a new transaction</Typography>
      </Button>
    );
  }, [isAutomaticRoute, isClaimInProgress, isTxComplete]);

  return (
    <div className={joinClass([classes.container, classes.spacer])}>
      {header}
      {statusHeader}
      {etaCircle}
      <TransactionDetails />
      {actionButton}
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default Redeem;
