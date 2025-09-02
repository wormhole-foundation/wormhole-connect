import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme, Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import config from 'config';
import { RouteContext } from 'contexts/RouteContext';
import AssetBadge from 'components/AssetBadge';
import ExplorerLink from 'components/ExplorerLink';
import {
  calculateUSDPrice,
  getTransactionExplorerUrl,
  getWalletExplorerUrl,
  millisToHumanString,
  trimAddress,
  getTokenSymbol,
} from 'utils';
import { getExplorerInfo } from 'utils/sdkv2';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import type { RootState } from 'store';
import { useTokens } from 'contexts/TokensContext';

const TransactionDetails = () => {
  const theme = useTheme();
  const routeContext = React.useContext(RouteContext);

  const styles = useMemo(
    () => ({
      container: {
        width: '100%',
        maxWidth: '420px',
        backgroundColor: theme.palette.input.background,
      },
      card: {
        width: '100%',
        backgroundColor: theme.palette.input.background,
      },
    }),
    [theme],
  );

  const {
    sendTx,
    sender,
    amount,
    recipient,
    toChain,
    fromChain,
    token,
    receivedToken,
    receiveAmount,
    receiveNativeAmount,
    eta,
  } = useSelector((state: RootState) => state.redeem.txData)!;

  const { route: routeName } = useSelector((state: RootState) => state.redeem);

  const sourceToken = config.tokens.get(token);
  const destToken = config.tokens.get(receivedToken);

  const { getTokenPrice, isFetchingTokenPrices, lastTokenPriceUpdate } =
    useTokens();

  // Separator with a unicode dot in the middle
  const separator = useMemo(
    () => (
      <Typography component="span" padding="0px 8px">{`\u00B7`}</Typography>
    ),
    [],
  );

  // Render details for the sent amount
  const sentAmount = useMemo(() => {
    if (!sourceToken || !fromChain) {
      return <></>;
    }

    const sourceTokenConfig = config.tokens.get(token);
    const sourceChainConfig = config.chains[fromChain]!;

    const usdAmount = calculateUSDPrice(
      getTokenPrice,
      amount,
      sourceTokenConfig,
    );

    const senderAddress = sender ? trimAddress(sender) : '';
    const explorerUrl = sender ? getWalletExplorerUrl(fromChain, sender) : '';

    const formattedAmount = sdkAmount.display(sdkAmount.truncate(amount, 6));

    return (
      <Stack alignItems="center" direction="row" justifyContent="flex-start">
        <AssetBadge chainConfig={sourceChainConfig} token={sourceTokenConfig} />
        <Stack direction="column" marginLeft="12px">
          <Typography fontSize={16}>
            {formattedAmount} {getTokenSymbol(sourceToken)}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {isFetchingTokenPrices ? (
              <CircularProgress size={14} />
            ) : (
              <>
                {usdAmount}
                {usdAmount ? separator : null}
                {sourceChainConfig.displayName}
                {explorerUrl ? (
                  <>
                    {separator}
                    <ExplorerLink url={explorerUrl} text={senderAddress} />
                  </>
                ) : null}
              </>
            )}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [
    sourceToken,
    fromChain,
    token,
    getTokenPrice,
    amount,
    sender,
    theme.palette.text.secondary,
    isFetchingTokenPrices,
    separator,
  ]);

  // Render details for the received amount
  const receivedAmount = useMemo(() => {
    if (!destToken || !toChain) {
      return <></>;
    }

    const destChainConfig = config.chains[toChain]!;

    const usdAmount = calculateUSDPrice(
      getTokenPrice,
      receiveAmount,
      destToken,
    );

    const recipientAddress = recipient ? trimAddress(recipient) : '';
    const explorerUrl = recipient
      ? getWalletExplorerUrl(toChain, recipient)
      : '';

    const formattedReceiveAmount = receiveAmount
      ? sdkAmount.display(sdkAmount.truncate(receiveAmount, 6))
      : '-';

    return (
      <Stack alignItems="center" direction="row" justifyContent="flex-start">
        <AssetBadge chainConfig={destChainConfig} token={destToken} />
        <Stack direction="column" marginLeft="12px">
          <Typography fontSize={16}>
            {formattedReceiveAmount} {getTokenSymbol(destToken)}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {isFetchingTokenPrices ? (
              <CircularProgress size={14} />
            ) : (
              <>
                {usdAmount}
                {usdAmount ? separator : null}
                {destChainConfig.displayName}
                {explorerUrl ? (
                  <>
                    {separator}
                    <ExplorerLink url={explorerUrl} text={recipientAddress} />
                  </>
                ) : null}
              </>
            )}
          </Typography>
        </Stack>
      </Stack>
    );
    // ESLint complains that lastTokenPriceUpdate is unused/unnecessary here, but that's wrong.
    // We want to recompute the price after we update conversion rates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    destToken,
    getTokenPrice,
    receiveAmount,
    recipient,
    separator,
    theme.palette.text.secondary,
    toChain,
    isFetchingTokenPrices,
    lastTokenPriceUpdate,
  ]);

  // Vertical line that connects sender and receiver token icons
  const verticalConnector = useMemo(
    () => (
      <Stack
        height="28px"
        borderLeft="1px solid #8B919D"
        marginLeft="16px"
      ></Stack>
    ),
    [],
  );

  const destinationGas = useMemo(() => {
    if (
      !receivedToken ||
      !receiveNativeAmount ||
      sdkAmount.units(receiveNativeAmount) === 0n
    ) {
      return <></>;
    }

    const destChainConfig = config.chains[toChain];

    if (!destChainConfig) {
      return <></>;
    }

    const gasTokenPrice = calculateUSDPrice(
      getTokenPrice,
      receiveNativeAmount,
      config.tokens.getGasToken(destChainConfig.sdkName),
    );

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Additional gas
        </Typography>
        {isFetchingTokenPrices ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{gasTokenPrice}</Typography>
        )}
      </Stack>
    );
    // ESLint complains that lastTokenPriceUpdate is unused/unnecessary here, but that's wrong.
    // We want to recompute the price after we update conversion rates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    receiveNativeAmount,
    theme.palette.text.secondary,
    toChain,
    isFetchingTokenPrices,
    lastTokenPriceUpdate,
  ]);

  const explorerLink = useMemo(() => {
    // Fallback to routeName if RouteContext value is not available
    const route = routeContext.route ?? routeName;

    if (!route) {
      return null;
    }

    // Get explorer name and url for the route
    const { name, url } = getExplorerInfo(route, sendTx, fromChain, toChain);

    // Don't show the explorer link if we don't have a valid explorer URL
    if (!URL.canParse(url)) {
      return null;
    }

    return (
      <Stack alignItems="center" padding="24px 12px">
        <Link
          display="flex"
          gap="8px"
          href={url}
          rel="noreferrer"
          target="_blank"
          underline="none"
        >
          <Typography
            color={theme.palette.text.primary}
            fontSize={14}
          >{`View on ${name}`}</Typography>
        </Link>
      </Stack>
    );
  }, [
    fromChain,
    routeContext.route,
    routeName,
    sendTx,
    theme.palette.text.primary,
    toChain,
  ]);

  const timeToDestination = useMemo(() => {
    let etaDisplay: string | ReactNode = <CircularProgress size={14} />;

    if (!eta) return null;

    etaDisplay = millisToHumanString(eta);

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          {`Time to ${toChain}`}
        </Typography>
        <Typography fontSize={14}>{etaDisplay}</Typography>
      </Stack>
    );
  }, [eta, theme.palette.text.secondary, toChain]);

  const trimmedTx = sendTx ? trimAddress(sendTx) : '';
  const explorerUrl = sendTx
    ? getTransactionExplorerUrl(fromChain, sendTx)
    : '';

  return (
    <Box sx={styles.container}>
      <Card sx={styles.card}>
        <CardContent>
          <Stack direction="row" spacing={1} marginBottom="12px">
            <Typography color={theme.palette.text.secondary}>
              Transaction
            </Typography>
            <Typography color={theme.palette.text.secondary}>
              {explorerUrl ? (
                <ExplorerLink url={explorerUrl} text={trimmedTx} />
              ) : (
                trimmedTx
              )}
            </Typography>
          </Stack>
          {sentAmount}
          {verticalConnector}
          {receivedAmount}
          <Stack
            direction="column"
            gap="8px"
            justifyContent="space-between"
            marginTop="16px"
          >
            {destinationGas}
            {timeToDestination}
          </Stack>
        </CardContent>
        <Divider flexItem sx={{ margin: '0 16px', opacity: '50%' }} />
        {explorerLink}
      </Card>
    </Box>
  );
};

export default TransactionDetails;
