import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import { finality, chainIdToChain } from '@wormhole-foundation/sdk-base';

import config from 'config';
import useAvailableRoutes from 'hooks/useAvailableRoutes';
import RouteOperator from 'routes/operator';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { setTransferRoute } from 'store/transferInput';
import { calculateUSDPrice, isEmptyObject } from 'utils';
import { toFixedDecimals } from 'utils/balance';
import { isGatewayChain } from 'utils/cosmos';
import { millisToMinutesAndSeconds } from 'utils/transferValidation';

import type { ChainName } from 'sdklegacy';
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
};

const SingleRoute = (props: Props) => {
  const dispatch = useDispatch();
  const { classes } = useStyles();
  const theme = useTheme();

  const {
    token: sourceToken,
    destToken,
    fromChain: sourceChain,
    toChain: destChain,
    amount,
    routeStates,
  } = useSelector((state: RootState) => state.transferInput);

  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );

  const {
    usdPrices: { data: tokenPrices },
  } = useSelector((state: RootState) => state.tokenPrices);

  const [receiveAmount, setReceiveAmount] = useState<number | undefined>(
    undefined,
  );
  const [receiveAmountUSD, setReceiveAmountUSD] = useState<string | undefined>(
    undefined,
  );
  const [estimatedTime, setEstimatedTime] = useState<string | undefined>(
    undefined,
  );

  const [isFeesBreakdownOpen, setIsFeesBreakdownOpen] = useState(false);

  useAvailableRoutes();

  useEffect(() => {
    let cancelled = false;

    async function computeFees() {
      try {
        const routeOptions = { nativeGas: toNativeToken };

        const receiveAmount = await RouteOperator.computeReceiveAmountWithFees(
          props.config.route,
          Number.parseFloat(amount),
          sourceToken,
          destToken,
          sourceChain,
          destChain,
          routeOptions,
        );

        if (!cancelled) {
          setReceiveAmount(
            Number.parseFloat(toFixedDecimals(`${receiveAmount}`, 6)),
          );
          setReceiveAmountUSD(
            calculateUSDPrice(
              receiveAmount,
              tokenPrices || {},
              config.tokens[destToken],
            ),
          );
          setEstimatedTime(getEstimatedTime(sourceChain));
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setReceiveAmount(0);
          setReceiveAmountUSD('');
          setEstimatedTime(getEstimatedTime(sourceChain));
        }
      }
    }

    computeFees();

    return () => {
      cancelled = true;
    };
  }, [
    props.config,
    amount,
    toNativeToken,
    relayerFee,
    sourceToken,
    destToken,
    sourceChain,
    destChain,
    tokenPrices,
  ]);

  const onSelect = useCallback(
    (value: Route) => {
      if (routeStates && routeStates.some((rs) => rs.name === value)) {
        const route = routeStates.find((rs) => rs.name === value);
        if (route?.available) dispatch(setTransferRoute(value));
      }
    },
    [routeStates, dispatch],
  );

  const getEstimatedTime = useCallback((chain?: ChainName) => {
    if (!chain) {
      return undefined;
    }

    const chainName = chainIdToChain(config.wh.toChainId(chain));
    const chainFinality = finality.finalityThreshold.get(chainName);

    if (typeof chainFinality === 'undefined') {
      return undefined;
    }

    const blockTime = finality.blockTime.get(chainName);

    if (typeof blockTime === 'undefined') {
      return undefined;
    }

    return chainFinality === 0
      ? 'Instantly'
      : millisToMinutesAndSeconds(blockTime * chainFinality);
  }, []);

  const totalFees = useMemo(() => {
    return (
      <>
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Total fees
        </Typography>
        {relayerFee ? (
          <Typography fontSize={14}>{relayerFee}</Typography>
        ) : (
          <CircularProgress size={14} />
        )}
      </>
    );
  }, [relayerFee]);

  const feesBreakdown = useMemo(() => {
    return (
      <>
        <Typography
          color={theme.palette.text.secondary}
          fontSize={14}
          paddingLeft="8px"
        >
          Bridge fee
        </Typography>

        {relayerFee ? (
          <Typography fontSize={14}>{relayerFee}</Typography>
        ) : (
          <CircularProgress size={14} />
        )}
      </>
    );
  }, [isFeesBreakdownOpen, relayerFee]);

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

  if (isEmptyObject(props.config)) {
    return <></>;
  }

  const { name, route, providedBy } = props.config;

  return (
    <div className={classes.container}>
      <Typography fontSize={16} paddingBottom={0} width="100%" textAlign="left">
        {name}
      </Typography>
      <Card
        key={name}
        className={`${classes.card}`}
        sx={{
          border: props.isSelected
            ? '1px solid #C1BBF6'
            : '1px solid transparent',
        }}
      >
        <CardActionArea
          disabled={!props.available}
          disableTouchRipple
          onClick={() => onSelect(route)}
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
            title={`${receiveAmount} ${destToken}`}
            subheader={`${receiveAmountUSD} via ${providedBy}`}
          />
          <CardContent>
            <Stack direction="row" justifyContent="space-between">
              {totalFees}
            </Stack>
            <Collapse in={isFeesBreakdownOpen}>
              <Stack direction="row" justifyContent="space-between">
                {feesBreakdown}
              </Stack>
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
