import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { makeStyles } from 'tss-react/mui';
import { amount, routes } from '@wormhole-foundation/sdk';

import config from 'config';
import { useGasSlider } from 'hooks/useGasSlider';
import ErrorIcon from 'icons/Error';
import WarningIcon from 'icons/Warning';
import TokenIcon from 'icons/TokenIcons';
import {
  calculateUSDPrice,
  calculateUSDPriceRaw,
  getUSDFormat,
  millisToHumanString,
  formatDuration,
} from 'utils';
import { joinClass } from 'utils/style';

import type { RootState } from 'store';
import FastestRoute from 'icons/FastestRoute';
import CheapestRoute from 'icons/CheapestRoute';
import { useGetTokens } from 'hooks/useGetTokens';
import { useTokens } from 'contexts/TokensContext';
import { Token } from 'config/tokens';
import { opacify } from 'utils/theme';
import GasSlider from 'views/v2/Bridge/GasSlider';

const HIGH_FEE_THRESHOLD = 20; // dollhairs

const useStyles = makeStyles()((theme: any) => ({
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
    backgroundColor: opacify(theme.palette.primary.main, 0.05),
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
    position: 'relative',
    top: '2px',
    marginRight: '4px',
    fill: theme.palette.primary.main,
  },
  cheapestBadge: {
    width: '12px',
    height: '12px',
    position: 'relative',
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
    pointerEvents: 'none',
  },
}));

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
  const { classes } = useStyles();
  const theme = useTheme();
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
    destChain,
    destToken: destToken?.key,
    route: props.route,
    isTransactionInProgress,
  });

  const [feePrice, isHighFee, feeTokenConfig]: [
    number | undefined,
    boolean,
    Token | undefined,
  ] = useMemo(() => {
    if (!quote?.relayFee) {
      return [undefined, false, undefined];
    }

    const relayFee = amount.whole(quote.relayFee.amount);
    const feeToken = config.tokens.get(quote.relayFee.token);
    const feePrice = calculateUSDPriceRaw(getTokenPrice, relayFee, feeToken);

    if (feePrice === undefined) {
      return [undefined, false, undefined];
    }

    return [feePrice, feePrice > HIGH_FEE_THRESHOLD, feeToken];
  }, [getTokenPrice, quote?.relayFee]);

  const relayerFee = useMemo(() => {
    if (!routeConfig.AUTOMATIC_DEPOSIT) {
      return <>You pay gas on {destChain}</>;
    }

    if (!quote || !feePrice || !feeTokenConfig) {
      return <></>;
    }

    const feePriceFormatted = getUSDFormat(feePrice);

    let feeValue = `${amount.display(
      amount.truncate(quote!.relayFee!.amount, 6),
    )} ${feeTokenConfig.display} (${feePriceFormatted})`;

    // Wesley made me do it
    // Them PMs :-/
    if (props.route.startsWith('MayanSwap')) {
      feeValue = feePriceFormatted;
    }

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography
          color={theme.palette.text.secondary}
          component="div"
          fontSize="14px"
          lineHeight="14px"
        >
          Network cost
        </Typography>
        <Typography
          color={theme.palette.text.primary}
          component="div"
          fontSize="14px"
          lineHeight="14px"
        >
          {feeValue}
        </Typography>
      </Stack>
    );
  }, [
    destChain,
    feePrice,
    feeTokenConfig,
    props.route,
    quote,
    routeConfig.AUTOMATIC_DEPOSIT,
    theme.palette.text.primary,
    theme.palette.text.secondary,
  ]);

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
        <Stack
          className={classes.messageContainer}
          direction="row"
          alignItems="center"
        >
          <ErrorIcon className={classes.errorIcon} />
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
    classes.errorIcon,
    classes.messageContainer,
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
            className={classes.messageContainer}
            direction="row"
            alignItems="center"
          >
            <WarningIcon className={classes.warningIcon} />
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
              className={classes.messageContainer}
              direction="row"
              alignItems="center"
            >
              <WarningIcon className={classes.warningIcon} />
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
            className={classes.messageContainer}
            direction="row"
            alignItems="center"
          >
            <WarningIcon className={classes.warningIcon} />
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
    classes.warningIcon,
    classes.messageContainer,
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
      return amount.display(amount.truncate(quote.destinationToken.amount, 6));
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
          <FastestRoute className={classes.fastestBadge} />
          {props.isOnlyChoice ? 'Fast' : 'Fastest'}
        </>
      );
    } else if (props.isCheapest && !props.isOnlyChoice) {
      return (
        <>
          <CheapestRoute className={classes.cheapestBadge} /> Cheapest
        </>
      );
    } else {
      return null;
    }
  }, [
    props.isFastest,
    props.isCheapest,
    props.isOnlyChoice,
    classes.fastestBadge,
    classes.cheapestBadge,
  ]);

  if (!props.route) {
    return <></>;
  }

  return (
    <div key={props.route} className={classes.container}>
      <Card
        className={joinClass([
          classes.card,
          isSelected && classes.cardSelected,
          isTransactionInProgress && classes.disabled,
        ])}
        sx={{
          border: '1px solid',
          borderColor: isSelected ? theme.palette.primary.main : 'transparent',
          opacity: 1,
        }}
      >
        <CardActionArea
          disabled={
            isTransactionInProgress ||
            typeof props.onSelect !== 'function' ||
            props.error !== undefined
          }
          disableTouchRipple
          sx={{ cursor }}
          onClick={() => {
            props.onSelect?.(props.route);
          }}
        >
          <CardHeader
            avatar={<TokenIcon icon={destToken?.icon} />}
            className={classes.cardHeader}
            title={routeCardHeader}
            subheader={routeCardSubHeader}
            action={routeCardBadge}
          />
          <CardContent className={classes.cardContent}>
            <Stack gap="14px">
              {relayerFee}
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
                />
              </Collapse>
            </>
          )}
        </CardActionArea>
      </Card>
    </div>
  );
};

export default SingleRoute;
