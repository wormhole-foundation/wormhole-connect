import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme, Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { amount, routes } from '@wormhole-foundation/sdk';

import config from 'config';
import { useGasSlider } from 'hooks/useGasSlider';
import ErrorIcon from 'icons/Error';
import WarningIcon from 'icons/Warning';
import TokenIcon from 'icons/TokenIcons';
import {
  calculateUSDPrice,
  calculateUSDPriceRaw,
  millisToHumanString,
  formatDuration,
  isExecutorRoute,
} from 'utils';

import type { RootState } from 'store';
import FastestRoute from 'icons/FastestRoute';
import CheapestRoute from 'icons/CheapestRoute';
import { useGetTokens } from 'hooks/useGetTokens';
import { useTokens } from 'contexts/TokensContext';
import GasSlider from 'views/v2/Bridge/GasSlider';
import Color from 'color';
import { formatWithCommas } from 'utils/formatNumber';

const HIGH_FEE_THRESHOLD = 20; // dollhairs

type Props = {
  route: string;
  isSelected: boolean;
  error?: string;
  destinationGasDrop?: amount.Amount;
  isFastest?: boolean;
  isCheapest?: boolean;
  isOnlyChoice?: boolean;
  onSelect?: (route: string) => void;
  quote?: routes.Quote<routes.Options>;
};

const SingleRoute = (props: Props) => {
  const theme = useTheme();
  const styles = useMemo(
    () => ({
      container: {
        width: '100%',
        maxWidth: '420px',
        marginBottom: '8px',
      },
      card: {
        borderRadius: '8px',
        width: '100%',
        maxWidth: '420px',
      },
      cardSelected: {
        backgroundColor: theme.palette.input.fillTreatment
          ? Color(theme.palette.primary.main).alpha(0.05).hexa()
          : theme.palette.card.background,
        borderColor: theme.palette.primary.main,
      },
      cardHeader: {
        padding: '20px 20px 0px',
      },
      cardContent: {
        marginTop: '18px',
        padding: '0px 20px 20px',
      },
      errorIcon: {
        color: theme.palette.error.main,
        height: '34px',
        width: '34px',
        marginRight: '24px',
      },
      fastestBadge: {
        width: '14px',
        height: '14px',
        position: 'relative' as const,
        top: '2px',
        marginRight: '4px',
        fill: theme.palette.primary.main,
      },
      cheapestBadge: {
        width: '12px',
        height: '12px',
        position: 'relative' as const,
        top: '1px',
        marginRight: '3px',
        fill: theme.palette.primary.main,
      },
      messageContainer: {
        padding: '12px 0px 0px',
      },
      warningIcon: {
        color: theme.palette.warning.main,
        height: '34px',
        width: '34px',
        marginRight: '12px',
      },
      disabled: {
        opacity: '0.6',
        cursor: 'default',
        pointerEvents: 'none' as const,
      },
    }),
    [theme],
  );
  const routeConfig = config.routes.get(props.route);

  const {
    toChain: destChain,
    fromChain: sourceChain,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);

  const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

  const { quote, isSelected } = props;
  const receiveNativeAmount = quote?.destinationNativeGas;

  const { sourceToken, destToken } = useGetTokens();

  const { disabled: isGasSliderDisabled, showGasSlider } = useGasSlider({
    destToken,
    route: props.route,
    isTransactionInProgress,
  });

  const isHighFee = useMemo(() => {
    if (!quote?.relayFee) {
      return false;
    }

    const relayFee = amount.whole(quote.relayFee.amount);
    const feeToken = config.tokens.get(quote.relayFee.token);
    const feePrice = calculateUSDPriceRaw(getTokenPrice, relayFee, feeToken);

    if (feePrice === undefined) {
      return false;
    }

    return feePrice > HIGH_FEE_THRESHOLD;
  }, [getTokenPrice, quote?.relayFee]);

  const destinationGas = useMemo(() => {
    if (
      !destChain ||
      props.destinationGasDrop === undefined ||
      amount.units(props.destinationGasDrop) === 0n
    ) {
      return <></>;
    }

    const destChainConfig = config.chains[destChain];
    const nativeGasToken = config.tokens.getGasToken(destChain);

    if (!destChainConfig || !nativeGasToken) {
      return <></>;
    }

    const gasTokenPrice = calculateUSDPrice(
      getTokenPrice,
      props.destinationGasDrop,
      nativeGasToken,
    );

    const gasTokenAmount = amount.display(
      amount.truncate(props.destinationGasDrop, 6),
    );

    const gasTokenPriceStr = gasTokenPrice ? ` (${gasTokenPrice})` : '';

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography
          color={theme.palette.text.secondary}
          component="div"
          fontSize="14px"
          lineHeight="14px"
        >
          Additional gas
        </Typography>
        <Typography
          color={theme.palette.text.primary}
          component="div"
          fontSize="14px"
          lineHeight="14px"
        >{`${gasTokenAmount} ${nativeGasToken.symbol}${gasTokenPriceStr}`}</Typography>
      </Stack>
    );
    // We want to recompute the price after we update conversion rates (lastTokenPriceUpdate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    destChain,
    lastTokenPriceUpdate,
    props.destinationGasDrop,
    getTokenPrice,
    lastTokenPriceUpdate,
    theme.palette.text.secondary,
    theme.palette.text.primary,
  ]);

  const timeToDestination = useMemo(
    () => (
      <Stack direction="row" justifyContent="space-between">
        <Typography
          color={theme.palette.text.secondary}
          component="div"
          fontSize="14px"
          lineHeight="14px"
        >
          {`Time to ${destChain}`}
        </Typography>
        <Typography
          component="div"
          fontSize="14px"
          lineHeight="14px"
          sx={{
            color:
              quote?.eta && quote.eta < 60 * 1000
                ? theme.palette.success.main
                : theme.palette.text.primary,
          }}
        >
          {quote?.eta ? millisToHumanString(quote.eta) : 'N/A'}
        </Typography>
      </Stack>
    ),
    [
      destChain,
      quote?.eta,
      theme.palette.success.main,
      theme.palette.text.primary,
      theme.palette.text.secondary,
    ],
  );

  const isManual = useMemo(() => {
    if (!props.route) {
      return false;
    }

    return !routeConfig.AUTOMATIC_DEPOSIT;
  }, [props.route, routeConfig.AUTOMATIC_DEPOSIT]);

  const messageDivider = useMemo(
    () => <Divider flexItem sx={{ marginTop: '24px' }} />,
    [],
  );

  const errorMessage = useMemo(() => {
    if (!props.error) {
      return null;
    }

    return (
      <>
        {messageDivider}
        <Stack sx={styles.messageContainer} direction="row" alignItems="center">
          <ErrorIcon sx={styles.errorIcon} />
          <Typography
            color={theme.palette.error.main}
            fontSize="14px"
            lineHeight="18px"
          >
            {props.error}
          </Typography>
        </Stack>
      </>
    );
  }, [
    styles.errorIcon,
    styles.messageContainer,
    messageDivider,
    props.error,
    theme.palette.error.main,
  ]);

  const warningMessages = useMemo(() => {
    const messages: React.JSX.Element[] = [];

    if (isManual) {
      messages.push(
        <div key="ManualTransactionWarning">
          {messageDivider}
          <Stack
            sx={styles.messageContainer}
            direction="row"
            alignItems="center"
          >
            <WarningIcon sx={styles.warningIcon} />
            <Stack>
              <Typography
                color={theme.palette.warning.main}
                fontSize={14}
                lineHeight="18px"
              >
                This transfer requires two transactions.
              </Typography>
              <Typography
                color={theme.palette.text.secondary}
                fontSize={14}
                lineHeight="18px"
              >
                You will need to make two wallet approvals and have gas on the
                destination chain.
              </Typography>
            </Stack>
          </Stack>
        </div>,
      );
    }

    for (const warning of quote?.warnings || []) {
      if (
        warning.type === 'DestinationCapacityWarning' &&
        warning.delayDurationSec
      ) {
        const duration = formatDuration(warning.delayDurationSec);
        messages.push(
          <div key={`${warning.type}-${warning.delayDurationSec}`}>
            {messageDivider}
            <Stack
              sx={styles.messageContainer}
              direction="row"
              alignItems="center"
            >
              <WarningIcon sx={styles.warningIcon} />
              <Typography
                color={theme.palette.warning.main}
                fontSize={14}
                lineHeight="18px"
              >
                {`Your transfer to ${destChain} may be delayed due to rate limits set by ${
                  destToken!.display
                }. If your transfer is delayed, you will need to return after ${duration} to complete the transfer. Please consider this before proceeding.`}
              </Typography>
            </Stack>
          </div>,
        );
      }
    }

    if (isHighFee) {
      messages.push(
        <div key="HighFee">
          {messageDivider}
          <Stack
            sx={styles.messageContainer}
            direction="row"
            alignItems="center"
          >
            <WarningIcon sx={styles.warningIcon} />
            <Stack>
              <Typography
                color={theme.palette.warning.main}
                fontSize={14}
                lineHeight="18px"
              >
                Output amount is much lower than input amount.
              </Typography>
              <Typography
                color={theme.palette.text.secondary}
                fontSize={14}
                lineHeight="18px"
              >
                Double check before proceeding.
              </Typography>
            </Stack>
          </Stack>
        </div>,
      );
    }

    return messages;
  }, [
    isManual,
    isHighFee,
    messageDivider,
    styles.warningIcon,
    styles.messageContainer,
    theme.palette.warning.main,
    theme.palette.text.secondary,
    quote?.warnings,
    destToken,
    destChain,
  ]);

  const providerText = useMemo(() => {
    if (!sourceToken) {
      return '';
    }

    const isLidoNttSpecialCase =
      props.route === 'AutomaticNtt' &&
      sourceToken?.symbol === 'wstETH' &&
      ((sourceChain === 'Ethereum' && destChain === 'Bsc') ||
        (sourceChain === 'Bsc' && destChain === 'Ethereum'));

    const provider = isLidoNttSpecialCase
      ? 'via NTT: Wormhole + Axelar'
      : routeConfig.rc.meta.provider
      ? `via ${routeConfig.rc.meta.provider}`
      : '';

    return provider;
  }, [props.route, routeConfig, sourceChain, sourceToken, destChain]);

  const receiveAmount = useMemo(() => {
    return quote ? amount.whole(quote?.destinationToken.amount) : undefined;
  }, [quote]);

  const receiveAmountTrunc = useMemo(() => {
    if (quote) {
      const truncatedAmount = amount.display(
        amount.truncate(quote.destinationToken.amount, 6),
      );
      return formatWithCommas(truncatedAmount);
    } else {
      return undefined;
    }
  }, [quote]);

  const routeCardHeader = useMemo(() => {
    if (props.error) {
      return <Typography color="error">Route is unavailable</Typography>;
    }

    if (receiveAmount === undefined || !destToken) {
      return null;
    }

    const color = isHighFee
      ? theme.palette.warning.main
      : theme.palette.text.primary;

    return (
      <Typography
        fontSize="18px"
        lineHeight="18px"
        color={color}
        component="div"
        marginBottom="6px"
      >
        {receiveAmountTrunc} {destToken.symbol}
      </Typography>
    );
  }, [
    props.error,
    receiveAmount,
    receiveAmountTrunc,
    destToken,
    isHighFee,
    theme.palette.warning.main,
    theme.palette.text.primary,
  ]);

  const routeCardSubHeader = useMemo(() => {
    if (props.error || !destChain || !destToken) {
      return null;
    }

    if (receiveAmount === undefined) {
      return null;
    }

    const usdValue = calculateUSDPrice(getTokenPrice, receiveAmount, destToken);

    return (
      <Typography
        fontSize="14px"
        lineHeight="14px"
        color={theme.palette.text.secondary}
        component="div"
      >{`${usdValue} ${providerText}`}</Typography>
    );
    // We want to recompute the price after we update conversion rates (lastTokenPriceUpdate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    destChain,
    destToken,
    getTokenPrice,
    lastTokenPriceUpdate,
    props.error,
    providerText,
    receiveAmount,
    theme.palette.text.secondary,
  ]);

  // There are three states for the Card area cursor:
  // 1- If no action handler provided, fall back to default
  // 2- Otherwise there is an action handler, "pointer"
  const cursor = useMemo(() => {
    if (isSelected || typeof props.onSelect !== 'function') {
      return 'default';
    }

    if (props.error) {
      return 'not-allowed';
    }

    return 'pointer';
  }, [props.error, isSelected, props.onSelect]);

  const routeCardBadge = useMemo(() => {
    if (props.isFastest) {
      return (
        <>
          <FastestRoute sx={styles.fastestBadge} />
          {props.isOnlyChoice ? 'Fast' : 'Fastest'}
        </>
      );
    } else if (props.isCheapest && !props.isOnlyChoice) {
      return (
        <>
          <CheapestRoute sx={styles.cheapestBadge} /> Cheapest
        </>
      );
    } else {
      return null;
    }
  }, [
    props.isFastest,
    props.isCheapest,
    props.isOnlyChoice,
    styles.fastestBadge,
    styles.cheapestBadge,
  ]);

  if (!props.route) {
    return <></>;
  }

  return (
    <Box
      key={props.route}
      sx={{
        ...styles.container,
      }}
      data-testid={`route-${props.route}${isSelected ? '-selected' : ''}`}
    >
      <Card
        sx={{
          ...styles.card,
          ...(isSelected && styles.cardSelected),
          ...(isTransactionInProgress && styles.disabled),
          ...{
            border: '1px solid',
            borderColor: isSelected
              ? theme.palette.primary.main
              : 'transparent',
            opacity: 1,
          },
        }}
      >
        <CardActionArea
          component="div"
          disabled={
            isTransactionInProgress ||
            typeof props.onSelect !== 'function' ||
            props.error !== undefined
          }
          disableTouchRipple
          sx={{ cursor: cursor }}
          onClick={() => {
            props.onSelect?.(props.route);
          }}
        >
          <CardHeader
            sx={styles.cardHeader}
            avatar={<TokenIcon icon={destToken?.icon} />}
            title={routeCardHeader}
            subheader={routeCardSubHeader}
            action={routeCardBadge}
          />
          <CardContent sx={styles.cardContent}>
            <Stack gap="14px">
              {!routeConfig.AUTOMATIC_DEPOSIT
                ? `You pay gas on ${destChain}`
                : null}
              {destinationGas}
              {timeToDestination}
            </Stack>
            {errorMessage}
            {warningMessages}
          </CardContent>
          {showGasSlider && (
            <>
              <Divider flexItem sx={{ margin: '0px 16px' }} />
              <Collapse in={showGasSlider}>
                <GasSlider
                  destinationGasDrop={
                    receiveNativeAmount || amount.fromBaseUnits(0n, 8)
                  }
                  disabled={isGasSliderDisabled}
                  isExecutorRoute={isExecutorRoute(props.route)}
                  isSelected={isSelected}
                />
              </Collapse>
            </>
          )}
        </CardActionArea>
      </Card>
    </Box>
  );
};

export default SingleRoute;
