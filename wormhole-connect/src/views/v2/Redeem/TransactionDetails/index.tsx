import React, { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import Badge from '@mui/material/Badge';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { RouteContext } from 'contexts/RouteContext';
import TokenIcon from 'icons/TokenIcons';
import {
  calculateUSDPrice,
  millisToHumanString,
  trimAddress,
  trimTxHash,
} from 'utils';
import { getExplorerInfo } from 'utils/sdkv2';

import type { RootState } from 'store';
import { toFixedDecimals } from 'utils/balance';
import { formatStringAmount } from 'store/transferInput';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
  },
}));

const TransactionDetails = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const routeContext = React.useContext(RouteContext);

  const {
    sendTx,
    sender,
    amount,
    recipient,
    toChain,
    fromChain,
    tokenKey,
    receivedTokenKey,
    receiveAmount,
    receiveNativeAmount,
    relayerFee,
    eta,
  } = useSelector((state: RootState) => state.redeem.txData)!;

  const { route: routeName } = useSelector((state: RootState) => state.redeem);

  const { usdPrices: tokenPrices } = useSelector(
    (state: RootState) => state.tokenPrices,
  );

  // Render details for the sent amount
  const sentAmount = useMemo(() => {
    if (!tokenKey || !fromChain) {
      return <></>;
    }

    const sourceTokenConfig = config.tokens[tokenKey];
    const sourceChainConfig = config.chains[fromChain]!;

    const usdAmount = calculateUSDPrice(
      amount,
      tokenPrices.data,
      sourceTokenConfig,
    );

    const senderAddress = sender ? trimAddress(sender) : '';

    const formattedAmount = formatStringAmount(amount);

    return (
      <Stack alignItems="center" direction="row" justifyContent="flex-start">
        <Badge
          badgeContent={
            <TokenIcon icon={sourceChainConfig?.icon} height={16} />
          }
          sx={{
            marginRight: '4px',
            '& .MuiBadge-badge': {
              right: 2,
              top: 24,
            },
          }}
        >
          <TokenIcon icon={sourceTokenConfig?.icon} height={32} />
        </Badge>
        <Stack direction="column" marginLeft="12px">
          <Typography fontSize={16}>
            {formattedAmount} {sourceTokenConfig.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {tokenPrices.isFetching ? (
              <CircularProgress size={14} />
            ) : (
              `${usdAmount} \u2022 ${sourceChainConfig.displayName} \u2022 ${senderAddress}`
            )}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [amount, fromChain, sender, tokenKey, tokenPrices]);

  // Render details for the received amount
  const receivedAmount = useMemo(() => {
    if (!receivedTokenKey || !toChain) {
      return <></>;
    }

    const destTokenConfig = config.tokens[receivedTokenKey];
    const destChainConfig = config.chains[toChain]!;

    const usdAmount = calculateUSDPrice(
      receiveAmount,
      tokenPrices.data,
      destTokenConfig,
    );

    const recipientAddress = recipient ? trimAddress(recipient) : '';

    const formattedReceiveAmount = formatStringAmount(receiveAmount);

    return (
      <Stack alignItems="center" direction="row" justifyContent="flex-start">
        <Badge
          badgeContent={<TokenIcon icon={destChainConfig?.icon} height={16} />}
          sx={{
            marginRight: '4px',
            '& .MuiBadge-badge': {
              right: 2,
              top: 24,
            },
          }}
        >
          <TokenIcon icon={destTokenConfig?.icon} height={32} />
        </Badge>
        <Stack direction="column" marginLeft="12px">
          <Typography fontSize={16}>
            {formattedReceiveAmount} {destTokenConfig.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {tokenPrices.isFetching ? (
              <CircularProgress size={14} />
            ) : (
              `${usdAmount} \u2022 ${destChainConfig.displayName} \u2022 ${recipientAddress}`
            )}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [receiveAmount, receivedTokenKey, recipient, toChain, tokenPrices]);

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

  const bridgeFee = useMemo(() => {
    if (!relayerFee) {
      return <></>;
    }

    const feeTokenConfig = config.tokens[relayerFee.tokenKey];
    if (!feeTokenConfig) {
      return <></>;
    }

    const feePrice = calculateUSDPrice(
      relayerFee.fee,
      tokenPrices.data,
      feeTokenConfig,
    );

    if (!feePrice) {
      return <></>;
    }

    let feeValue = (
      <Typography fontSize={14}>{`${toFixedDecimals(
        relayerFee.fee.toString(),
        4,
      )} ${feeTokenConfig.symbol} (${feePrice})`}</Typography>
    );

    // Special request: For Mayan we show the USD amount only
    if (routeName?.startsWith('MayanSwap')) {
      feeValue = <Typography fontSize={14}>{feePrice}</Typography>;
    }

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Network cost
        </Typography>
        {tokenPrices.isFetching ? <CircularProgress size={14} /> : feeValue}
      </Stack>
    );
  }, [relayerFee, routeName, tokenPrices]);

  const destinationGas = useMemo(() => {
    if (!receivedTokenKey || !receiveNativeAmount) {
      return <></>;
    }

    const destChainConfig = config.chains[toChain];

    if (!destChainConfig) {
      return <></>;
    }

    const gasTokenPrice = calculateUSDPrice(
      receiveNativeAmount,
      tokenPrices.data,
      config.tokens[destChainConfig.gasToken],
    );

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Additional Gas
        </Typography>
        {tokenPrices.isFetching ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{gasTokenPrice}</Typography>
        )}
      </Stack>
    );
  }, [receiveNativeAmount, toChain, tokenPrices]);

  const explorerLink = useMemo(() => {
    // Fallback to routeName if RouteContext value is not available
    const route = routeContext.route ?? routeName;

    if (!route) {
      return null;
    }

    // Get explorer name and url for the route
    const { name, url } = getExplorerInfo(route, sendTx);

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
  }, [sendTx, routeContext.route]);

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
  }, [eta]);

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardContent>
          <Typography
            color={theme.palette.text.secondary}
            marginBottom="12px"
          >{`Transaction #${trimTxHash(sendTx)}`}</Typography>
          {sentAmount}
          {verticalConnector}
          {receivedAmount}
          <Stack
            direction="column"
            gap="8px"
            justifyContent="space-between"
            marginTop="16px"
          >
            {bridgeFee}
            {destinationGas}
            {timeToDestination}
          </Stack>
        </CardContent>
        <Divider flexItem sx={{ margin: '0 16px', opacity: '50%' }} />
        {explorerLink}
      </Card>
    </div>
  );
};

export default TransactionDetails;
