import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { useTimer } from 'react-timer-hook';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import AlertBannerV2 from 'components/v2/AlertBanner';
import config, { getWormholeContextV2 } from 'config';
import { RouteContext } from 'contexts/RouteContext';
import useTrackTransferInProgress from 'hooks/useTrackTransferInProgress';
import ArrowRight from 'icons/ArrowRight';
import TokenIcon from 'icons/TokenIcons';
import TxCompleteIcon from 'icons/TxComplete';
import {
  setRoute as setRedeemRoute,
  setIsResumeTx,
  setTimestamp,
  setTxDetails,
} from 'store/redeem';
import { setRoute as setAppRoute } from 'store/router';
import { setToChain } from 'store/transferInput';
import { toFixedDecimals } from 'utils/balance';
import { removeTxFromLocalStorage } from 'utils/inProgressTxCache';
import { minutesAndSecondsWithPadding } from 'utils/transferValidation';

import type { TransactionLocal } from 'config/types';

const useStyles = makeStyles()((theme: any) => ({
  alertBanner: {
    marginTop: '12px',
  },
  arrowIcon: {
    fontSize: '16px',
    margin: '0 4px',
  },
  card: {
    width: '100%',
    boxShadow: `0px 0px 3.5px 0px ${theme.palette.primary.main}`,
  },
  cardActionArea: {
    height: '76px',
  },
  chainIcon: {
    background: theme.palette.background.default,
    border: `2px solid ${theme.palette.modal.background}`,
    borderRadius: '6px',
    padding: '2px',
  },
  completedIcon: {
    color: theme.palette.success.main,
    height: '24px',
    width: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  progressBar: {
    borderRadius: '4px',
    marginTop: '8px',
  },
}));

type Props = {
  data: TransactionLocal;
};

const WidgetItem = (props: Props) => {
  const [error, setError] = useState('');
  const [etaExpired, setEtaExpired] = useState(false);

  const { classes } = useStyles();
  const dispatch = useDispatch();
  const routeContext = useContext(RouteContext);
  const theme = useTheme();

  const { data: transaction } = props;
  const { receipt, route, timestamp, txDetails, txHash } = transaction;
  const { amount, eta, fromChain, toChain, tokenKey } = txDetails || {};

  // Initialize the countdown
  const { seconds, minutes, totalSeconds, isRunning, restart } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => setEtaExpired(true),
  });

  const { isCompleted, isReadyToClaim } = useTrackTransferInProgress({
    eta,
    receipt,
    route,
  });

  useEffect(() => {
    if (isCompleted && txHash) {
      // Remove this transaction from local storage
      removeTxFromLocalStorage(txHash);
    }
  }, [isCompleted, txHash]);

  // Remaining from the original ETA since the creation of this transaction
  const etaRemaining = useMemo(() => {
    if (!eta || !timestamp) {
      // We need the sender timestamp to be able to calculate the remaining time
      // Otherwise do not render the remaining eta counter
      return 0;
    }

    const timePassed = Date.now() - timestamp;

    if (eta < timePassed) {
      return 0;
    }

    return eta - timePassed;
  }, [eta, timestamp, totalSeconds]);

  // Displays the countdown
  const etaCountdown = useMemo(() => {
    if (isReadyToClaim || transaction.isReadyToClaim) {
      return 'Ready to claim...';
    }

    if (etaExpired || etaRemaining === 0) {
      return 'Wrapping up...';
    }

    if (isRunning) {
      return minutesAndSecondsWithPadding(minutes, seconds);
    }

    return <CircularProgress size={16} />;
  }, [
    etaExpired,
    etaRemaining,
    isReadyToClaim,
    isRunning,
    minutes,
    seconds,
    transaction,
  ]);

  // A number value between 0-100
  const progressBarValue = useMemo(() => {
    // etaRemaining is guaranteed to be smaller than or equal to eta,
    // but we still check here as well to be on the safe side.
    if (!eta || etaRemaining > eta) {
      return 0;
    }

    // Return empty bar when computing the remaining eta and counter is running
    if (!etaExpired && etaRemaining === 0) {
      return 0;
    }

    // Return full bar when countdown expires
    if (etaExpired) {
      return 100;
    }

    return ((eta - etaRemaining) / eta) * 100;
  }, [eta, etaRemaining, isCompleted]);

  // Start the countdown timer
  useEffect(() => {
    if (!isRunning && !isCompleted && etaRemaining) {
      // Start only when:
      //   1- the timer hasn't been started yet and
      //   2- transaction is in progress and
      //   3- we have the remaining eta
      restart(new Date(Date.now() + etaRemaining), true);
    }
  }, [etaRemaining, isCompleted, isRunning]);

  // Action handler to navigate user to the Redeem view of this transaction
  const resumeTransaction = useCallback(async () => {
    // Clear previous errors when user clicks on the widget again
    setError('');

    try {
      const wh = await getWormholeContextV2();
      const sdkRoute = new (config.routes.get(route).rc)(wh);

      // Set the start time of the transaction
      dispatch(setTimestamp(timestamp));
      // Set transaction details required to display Redeem view
      dispatch(setTxDetails(txDetails));
      // Set to avoid send transfer.success event in Resume Transaction case
      dispatch(setIsResumeTx(true));
      // Set transaction route
      dispatch(setRedeemRoute(route));
      // Set transaction destination chain
      dispatch(setToChain(txDetails.toChain));
      // Set the App route to navigate user to Redeem view
      dispatch(setAppRoute('redeem'));

      routeContext.setRoute(sdkRoute);
      routeContext.setReceipt(receipt);
    } catch (e: unknown) {
      setError(`Error resuming transaction: ${txDetails.sendTx}`);
    }
  }, [receipt, route, timestamp, txDetails]);

  if (!transaction) {
    return <></>;
  }

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardActionArea
          disableTouchRipple
          disabled={!txDetails}
          className={classes.cardActionArea}
          onClick={resumeTransaction}
        >
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography display="flex" justifyContent="space-between">
                {isCompleted ? (
                  <TxCompleteIcon className={classes.completedIcon} />
                ) : (
                  etaCountdown
                )}
              </Typography>
              <Stack direction="row" alignItems="center">
                <Typography fontSize={14} marginRight="8px">
                  {`${toFixedDecimals(amount, 4)} ${
                    config.tokens[tokenKey].symbol
                  }`}
                </Typography>
                <Box className={classes.chainIcon}>
                  <TokenIcon
                    icon={config.chains[fromChain]?.icon}
                    height={24}
                  />
                </Box>
                <ArrowRight className={classes.arrowIcon} />
                <Box className={classes.chainIcon}>
                  <TokenIcon icon={config.chains[toChain]?.icon} height={24} />
                </Box>
              </Stack>
            </Stack>
            {!isCompleted && (
              <LinearProgress
                className={classes.progressBar}
                variant="determinate"
                value={progressBarValue}
              />
            )}
          </CardContent>
        </CardActionArea>
      </Card>
      <AlertBannerV2
        className={classes.alertBanner}
        color={error ? theme.palette.error.light : theme.palette.grey.A400}
        content={error}
        error={!!error}
        show={!!error}
      />
    </div>
  );
};

export default WidgetItem;
