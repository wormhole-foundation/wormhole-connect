import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { makeStyles } from 'tss-react/mui';
import { amount, routes } from '@wormhole-foundation/sdk';

import config from 'config';
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

import type { RootState } from 'store';
import FastestRoute from 'icons/FastestRoute';
import CheapestRoute from 'icons/CheapestRoute';
import { useGetTokens } from 'hooks/useGetTokens';
import { useTokens } from 'contexts/TokensContext';
import { Token } from 'config/tokens';
import { opacify } from 'utils/theme';

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

  const { toChain: destChain, fromChain: sourceChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { getTokenPrice, isFetchingTokenPrices } = useTokens();

  const { quote } = props;

  const { sourceToken, destToken } = useGetTokens();

  const [feePrice, isHighFee, feeToken]: [
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
  }, [quote?.relayFee]);

  const relayerFee = useMemo(() => {
    if (!routeConfig.AUTOMATIC_DEPOSIT) {
      return <>You pay gas on {destChain}</>;
    }

    if (!quote || !feePrice || !feeToken) {
      return <></>;
    }

    const feePriceFormatted = getUSDFormat(feePrice);

    let feeValue = `${amount.display(
      amount.truncate(quote!.relayFee!.amount, 6),
    )} ${feeToken.display} (${feePriceFormatted})`;

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
    feeToken,
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
  }, [
    destChain,
    props.destinationGasDrop,
    theme.palette.text.primary,
    theme.palette.text.secondary,
    isFetchingTokenPrices,
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
  }, [
    destChain,
    destToken,
    props.error,
    providerText,
    receiveAmount,
    theme.palette.text.secondary,
  ]);

  // There are three states for the Card area cursor:
  // 1- If no action handler provided, fall back to default
  // 2- Otherwise there is an action handler, "pointer"
  const cursor = useMemo(() => {
    if (props.isSelected || typeof props.onSelect !== 'function') {
      return 'default';
    }

    if (props.error) {
      return 'not-allowed';
    }

    return 'pointer';
  }, [props.error, props.isSelected, props.onSelect]);

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
        className={`${classes.card} ${
          props.isSelected ? classes.cardSelected : ''
        }`}
        sx={{
          border: '1px solid',
          borderColor: props.isSelected
            ? theme.palette.primary.main
            : 'transparent',
          opacity: 1,
        }}
      >
        <CardActionArea
          disabled={
            typeof props.onSelect !== 'function' || props.error !== undefined
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
        </CardActionArea>
      </Card>
    </div>
  );
};

export default SingleRoute;
