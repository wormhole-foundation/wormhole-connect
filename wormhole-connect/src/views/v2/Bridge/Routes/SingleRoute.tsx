import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress, useTheme } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import DownIcon from '@mui/icons-material/ExpandMore';
import UpIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Report';
import { makeStyles } from 'tss-react/mui';

import useComputeFees from 'hooks/useComputeFees';
import useComputeQuoteV2 from 'hooks/useComputeQuoteV2';
import RouteOperator from 'routes/operator';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { isEmptyObject } from 'utils';
import { toFixedDecimals } from 'utils/balance';
import { isGatewayChain } from 'utils/cosmos';

import type { Route } from 'config/types';
import type { RouteData } from 'config/routes';
import type { RootState } from 'store';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
    cursor: 'pointer',
    maxWidth: '420px',
  },
}));

type Props = {
  config: RouteData;
  available: boolean;
  isSelected: boolean;
  showDestinationGasFee?: boolean;
  title?: string;
  onSelect: (route: Route) => void;
};

const SingleRoute = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const {
    fromChain: sourceChain,
    token: sourceToken,
    toChain: destChain,
    destToken,
    amount,
  } = useSelector((state: RootState) => state.transferInput);

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const [isFeesBreakdownOpen, setIsFeesBreakdownOpen] = useState(false);

  const { name, route, providedBy } = props.config;

  // Compute the fees for this route
  const {
    receiveAmount,
    receiveAmountUSD,
    estimatedTime,
    isFetching: isFetchingFees,
  } = useComputeFees({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route,
    toNativeToken,
  });

  // Compute the quotes for this route
  const {
    receiveNativeAmt,
    relayerFee,
    isFetching: isFetchingQuote,
  } = useComputeQuoteV2({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route,
    toNativeToken,
  });

  const totalFees = useMemo(() => {
    let total = 0;

    if (relayerFee) {
      total += relayerFee || 0;
    }

    if (props.showDestinationGasFee && receiveNativeAmt) {
      total += receiveNativeAmt || 0;
    }

    return (
      <>
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Total fees
        </Typography>
        {isFetchingFees || isFetchingQuote ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>
            {Number.parseFloat(toFixedDecimals(`${total}`, 6))}
          </Typography>
        )}
      </>
    );
  }, [
    isFetchingFees,
    isFetchingQuote,
    props.showDestinationGasFee,
    relayerFee,
    receiveNativeAmt,
  ]);

  const bridgeFee = useMemo(
    () => (
      <Stack direction="row" justifyContent="space-between">
        <Typography
          color={theme.palette.text.secondary}
          fontSize={14}
          paddingLeft="8px"
        >
          Bridge fee
        </Typography>
        {isFetchingQuote ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{relayerFee}</Typography>
        )}
      </Stack>
    ),
    [isFetchingQuote, relayerFee],
  );

  const destinationGasFee = useMemo(() => {
    if (!receiveNativeAmt) {
      return null;
    }

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography
          color={theme.palette.text.secondary}
          fontSize={14}
          paddingLeft="8px"
        >
          Destination gas fee
        </Typography>
        {isFetchingQuote ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>
            {Number.parseFloat(toFixedDecimals(`${receiveNativeAmt}`, 6))}
          </Typography>
        )}
      </Stack>
    );
  }, [isFetchingQuote, receiveNativeAmt]);

  const feesBreakdown = useMemo(() => {
    return (
      <>
        {bridgeFee}
        {props.showDestinationGasFee && destinationGasFee}
      </>
    );
  }, [bridgeFee, destinationGasFee, props.showDestinationGasFee]);

  const timeToDestination = useMemo(() => {
    return (
      <>
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Time to destination
        </Typography>

        {estimatedTime ? (
          <Typography fontSize={14}>{estimatedTime}</Typography>
        ) : (
          <CircularProgress size={14} />
        )}
      </>
    );
  }, [estimatedTime]);

  const showWarning = useMemo(() => {
    if (!props.config.route) {
      return false;
    }

    const routeConfig = RouteOperator.getRoute(props.config.route);

    return !(
      routeConfig.AUTOMATIC_DEPOSIT ||
      (destChain && isGatewayChain(destChain)) ||
      destChain === 'sei' ||
      isPorticoRoute(routeConfig.TYPE)
    );
  }, [props.config.route, destChain]);

  const warningMessage = useMemo(() => {
    if (!showWarning) {
      return null;
    }
    return (
      <>
        <Divider flexItem sx={{ marginTop: '8px' }} />
        <Stack direction="row" alignItems="center">
          <WarningIcon htmlColor={theme.palette.warning.main} />
          <Stack sx={{ padding: '16px' }}>
            <Typography color={theme.palette.warning.main} fontSize={14}>
              This transfer requires two transactions
            </Typography>
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              You will need to make two wallet approvals and have gas on the
              destination chain.
            </Typography>
          </Stack>
        </Stack>
      </>
    );
  }, [showWarning]);

  const routeTitle = useMemo(() => {
    return typeof receiveAmount === 'undefined' ? (
      <CircularProgress size={18} />
    ) : (
      <Typography>
        {receiveAmount} {destToken}
      </Typography>
    );
  }, [receiveAmount, destToken]);

  const routeSubHeader = useMemo(() => {
    return typeof receiveAmountUSD === 'undefined' ? (
      <CircularProgress size={18} />
    ) : (
      <Typography>
        {receiveAmountUSD} via {providedBy}
      </Typography>
    );
  }, [receiveAmountUSD, providedBy]);

  if (isEmptyObject(props.config)) {
    return <></>;
  }

  return (
    <div className={classes.container}>
      <Typography fontSize={16} paddingBottom={0} width="100%" textAlign="left">
        {props.title || name}
      </Typography>
      <Card
        key={name}
        className={classes.card}
        sx={{
          border: props.isSelected
            ? '1px solid #C1BBF6'
            : '1px solid transparent',
        }}
      >
        <CardActionArea
          disabled={!props.available}
          disableTouchRipple
          onClick={() => props.onSelect(route)}
        >
          <CardHeader
            avatar={<Avatar>{props.config.icon()}</Avatar>}
            action={
              <IconButton
                onClick={(e) => {
                  setIsFeesBreakdownOpen(!isFeesBreakdownOpen);
                  e.stopPropagation();
                }}
              >
                {isFeesBreakdownOpen ? <UpIcon /> : <DownIcon />}
              </IconButton>
            }
            title={routeTitle}
            subheader={routeSubHeader}
          />
          <CardContent>
            <Stack direction="row" justifyContent="space-between">
              {totalFees}
            </Stack>
            <Collapse in={isFeesBreakdownOpen}>
              <Stack justifyContent="space-between">{feesBreakdown}</Stack>
            </Collapse>
            <Stack direction="row" justifyContent="space-between">
              {timeToDestination}
            </Stack>
            {warningMessage}
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
};

export default SingleRoute;
