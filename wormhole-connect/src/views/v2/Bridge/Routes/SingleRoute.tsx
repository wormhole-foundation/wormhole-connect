import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress, useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import WarningIcon from '@mui/icons-material/Report';
import { makeStyles } from 'tss-react/mui';
import { amount, routes } from '@wormhole-foundation/sdk';

import config from 'config';
import TokenIcon from 'icons/TokenIcons';
import { isEmptyObject, calculateUSDPrice, millisToHumanString } from 'utils';

import type { RouteData } from 'config/routes';
import type { RootState } from 'store';
import { formatBalance } from 'store/transferInput';
import { toFixedDecimals } from 'utils/balance';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
  },
}));

type Props = {
  route: RouteData;
  available: boolean;
  isSelected: boolean;
  error?: string;
  destinationGasDrop?: number;
  title?: string;
  onSelect?: (route: string) => void;
  quote?: routes.Quote<routes.Options>;
  isFetchingQuote: boolean;
};

const SingleRoute = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const {
    toChain: destChain,
    destToken,
    fromChain: sourceChain,
    token: sourceToken,
  } = useSelector((state: RootState) => state.transferInput);

  const { usdPrices: tokenPrices } = useSelector(
    (state: RootState) => state.tokenPrices,
  );

  const { name } = props.route;
  const { quote, isFetchingQuote } = props;

  const destTokenConfig = useMemo(() => config.tokens[destToken], [destToken]);

  const relayerFee = useMemo(() => {
    if (!quote?.relayFee) {
      return <></>;
    }

    const relayFee = amount.whole(quote.relayFee.amount);
    const feeToken = quote.relayFee.token;

    const feeTokenConfig = config.sdkConverter.findTokenConfigV1(
      feeToken,
      Object.values(config.tokens),
    );

    if (!feeTokenConfig) {
      return <></>;
    }

    const feePrice = calculateUSDPrice(
      relayFee,
      tokenPrices.data,
      feeTokenConfig,
      true,
    );

    if (!feePrice) {
      return <></>;
    }

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Relayer fee
        </Typography>
        {isFetchingQuote ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{`${toFixedDecimals(
            relayFee.toString(),
            4,
          )} ${feeTokenConfig.symbol} (${feePrice})`}</Typography>
        )}
      </Stack>
    );
  }, [destToken, isFetchingQuote, quote?.relayFee, tokenPrices]);

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
      tokenPrices.data,
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

  const timeToDestination = useMemo(
    () => (
      <>
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Time to destination
        </Typography>

        {isFetchingQuote ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>
            {quote?.eta ? millisToHumanString(quote.eta) : 'N/A'}
          </Typography>
        )}
      </>
    ),
    [quote?.eta, isFetchingQuote],
  );

  const showWarning = useMemo(() => {
    if (!props.route) {
      return false;
    }

    const routeConfig = config.routes.get(props.route.name);

    return !routeConfig.AUTOMATIC_DEPOSIT;
  }, [props.route.name]);

  const errorMessage = useMemo(() => {
    if (!props.error) {
      return null;
    }

    return (
      <>
        <Divider flexItem sx={{ marginTop: '8px' }} />
        <Stack direction="row" alignItems="center">
          <WarningIcon htmlColor={theme.palette.error.main} />
          <Stack sx={{ padding: '16px' }}>
            <Typography color={theme.palette.error.main} fontSize={14}>
              {props.error}
            </Typography>
          </Stack>
        </Stack>
      </>
    );
  }, [props.error]);

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

  const isAutomaticRoute = useMemo(() => {
    if (!props.route.name) {
      return false;
    }

    const route = config.routes.get(props.route.name);

    if (!route) {
      return false;
    }

    return route.AUTOMATIC_DEPOSIT;
  }, [props.route.name]);

  const providerText = useMemo(() => {
    if (!sourceToken) {
      return '';
    }

    const { providedBy, name } = props.route;

    const { symbol } = config.tokens[sourceToken];

    let provider = '';

    // Special case for Lido NTT
    if (
      name === 'AutomaticNtt' &&
      symbol === 'wstETH' &&
      ((sourceChain === 'Ethereum' && destChain === 'Bsc') ||
        (sourceChain === 'Bsc' && destChain === 'Ethereum'))
    ) {
      provider = 'via NTT: Wormhole + Axelar';
    }
    // We are skipping the provider text (e.g. "via ...") for xLabs
    else if (providedBy && !providedBy.toLowerCase().includes('xlabs')) {
      provider = `via ${props.route.providedBy}`;
    }

    return provider;
  }, [
    props.route.providedBy,
    props.route.name,
    sourceToken,
    sourceChain,
    destChain,
  ]);

  const routeTitle = useMemo(
    () => (isAutomaticRoute ? 'Automatic route' : 'Manual route'),
    [isAutomaticRoute],
  );

  const receiveAmount = useMemo(() => {
    return quote ? amount.whole(quote?.destinationToken.amount) : undefined;
  }, [quote]);

  const receiveAmountTrunc = useMemo(() => {
    return quote && destChain
      ? formatBalance(
          destChain,
          destTokenConfig,
          quote.destinationToken.amount.amount,
        )
      : undefined;
  }, [quote]);

  const routeCardHeader = useMemo(() => {
    if (props.error) {
      return <Typography color="error">Route is unavailable</Typography>;
    }

    if (props.isFetchingQuote) {
      return <CircularProgress size={18} />;
    }

    if (receiveAmount === undefined) {
      return null;
    }

    return (
      <Typography>
        {receiveAmountTrunc} {destTokenConfig.symbol}
      </Typography>
    );
  }, [destToken, receiveAmountTrunc]);

  const routeCardSubHeader = useMemo(() => {
    if (props.error || !destChain) {
      return null;
    }

    if (props.isFetchingQuote) {
      return <CircularProgress size={18} />;
    }

    if (receiveAmount === undefined) {
      return null;
    }

    const receiveAmountPrice = calculateUSDPrice(
      receiveAmount,
      tokenPrices.data,
      destTokenConfig,
    );

    return (
      <Typography
        fontSize={14}
        color={theme.palette.text.secondary}
      >{`${receiveAmountPrice} ${providerText}`}</Typography>
    );
  }, [destTokenConfig, providerText, receiveAmount, tokenPrices]);

  // There are three states for the Card area cursor:
  // 1- If not available in the first place, "not-allowed"
  // 2- If available but no action handler provided, fall back to default
  // 3- Both available and there is an action handler, "pointer"
  const cursor = useMemo(() => {
    if (!props.available) {
      return 'not-allowed';
    } else if (typeof props.onSelect !== 'function') {
      return 'auto';
    }

    return 'pointer';
  }, [props.available, props.onSelect]);

  if (isEmptyObject(props.route)) {
    return <></>;
  }

  return (
    <div key={name} className={classes.container}>
      <Typography
        fontSize={16}
        paddingBottom={0}
        marginBottom="8px"
        width="100%"
        textAlign="left"
      >
        {props.title || routeTitle}
      </Typography>
      <Card
        className={classes.card}
        sx={{
          border: props.isSelected
            ? '1px solid #C1BBF6'
            : '1px solid transparent',
          cursor,
          opacity: props.available ? 1 : 0.6,
        }}
      >
        <CardActionArea
          disabled={!props.available || typeof props.onSelect !== 'function'}
          disableTouchRipple
          onClick={() => {
            props.onSelect?.(props.route.name);
          }}
        >
          <CardHeader
            avatar={<TokenIcon icon={destTokenConfig.icon} height={36} />}
            title={routeCardHeader}
            subheader={routeCardSubHeader}
          />
          <CardContent>
            <Stack justifyContent="space-between">
              {relayerFee}
              {destinationGas}
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              {timeToDestination}
            </Stack>
            {errorMessage}
            {warningMessage}
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
};

export default SingleRoute;
