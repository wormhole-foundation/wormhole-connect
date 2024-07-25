import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress, useTheme } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import WarningIcon from '@mui/icons-material/Report';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import useComputeFees from 'hooks/useComputeFees';
import useComputeQuoteV2 from 'hooks/useComputeQuoteV2';
import useFetchTokenPricesV2 from 'hooks/useFetchTokenPricesV2';
import RouteOperator from 'routes/operator';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { isEmptyObject, calculateUSDPrice } from 'utils';
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
  destinationGasDrop?: number;
  title?: string;
  onSelect?: (route: Route) => void;
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

  const { prices: tokenPrices } = useFetchTokenPricesV2();

  const { name, route } = props.config;

  // Compute the fees for this route
  const {
    receiveAmount,
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
  const { relayerFee, isFetching: isFetchingQuote } = useComputeQuoteV2({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route,
    toNativeToken,
  });

  const bridgeFee = useMemo(() => {
    const bridgePrice = calculateUSDPrice(
      relayerFee,
      tokenPrices,
      config.tokens[destToken],
      true,
    );

    if (!bridgePrice) {
      return <></>;
    }

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Bridge fee
        </Typography>
        {isFetchingQuote ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{bridgePrice}</Typography>
        )}
      </Stack>
    );
  }, [destToken, isFetchingQuote, relayerFee, tokenPrices]);

  const destinationGas = useMemo(() => {
    if (!destChain || !props.destinationGasDrop) {
      return <></>;
    }

    const destChainConfig = config.chains[destChain];

    if (!destChainConfig) {
      return <></>;
    }

    const gasTokenPrice = calculateUSDPrice(
      props.destinationGasDrop,
      tokenPrices,
      config.tokens[destChainConfig.gasToken],
      true,
    );

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Gas top up
        </Typography>
        {isFetchingQuote ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{gasTokenPrice}</Typography>
        )}
      </Stack>
    );
  }, [destChain, isFetchingQuote, props.destinationGasDrop]);

  const timeToDestination = useMemo(() => {
    return (
      <>
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Time to destination
        </Typography>

        {isFetchingFees ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{estimatedTime}</Typography>
        )}
      </>
    );
  }, [estimatedTime, isFetchingFees]);

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
    if (typeof receiveAmount === 'undefined') {
      return <CircularProgress size={18} />;
    }

    if (!destChain) {
      return <></>;
    }

    const destChainConfig = config.chains[destChain];

    if (!destChainConfig) {
      return <></>;
    }

    const receiveAmountPrice = calculateUSDPrice(
      receiveAmount,
      tokenPrices,
      config.tokens[destChainConfig.gasToken],
    );

    return <Typography>{receiveAmountPrice}</Typography>;
  }, [destChain, receiveAmount, tokenPrices]);

  if (isEmptyObject(props.config)) {
    return <></>;
  }

  return (
    <div key={name} className={classes.container}>
      <Typography fontSize={16} paddingBottom={0} width="100%" textAlign="left">
        {props.title || name}
      </Typography>
      <Card
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
          onClick={() => {
            props.onSelect?.(route);
          }}
        >
          <CardHeader
            avatar={<Avatar>{props.config.icon()}</Avatar>}
            title={routeTitle}
            subheader={routeSubHeader}
          />
          <CardContent>
            <Stack justifyContent="space-between">
              {bridgeFee}
              {destinationGas}
            </Stack>
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
