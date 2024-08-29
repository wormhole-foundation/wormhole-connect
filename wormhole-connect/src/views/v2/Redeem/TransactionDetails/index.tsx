import React, { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import LaunchIcon from '@mui/icons-material/Launch';
import { CircularProgress, useTheme } from '@mui/material';
import Badge from '@mui/material/Badge';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { WORMSCAN } from 'config/constants';
import useFetchTokenPricesV2 from 'hooks/useFetchTokenPricesV2';
import TokenIcon from 'icons/TokenIcons';
import { calculateUSDPrice, trimAddress, trimTxHash } from 'utils';
import { millisToMinutesAndSeconds } from 'utils/transferValidation';

import type { RootState } from 'store';

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

  const { prices: tokenPrices, isFetching: isFetchingTokenPrices } =
    useFetchTokenPricesV2();

  // Render details for the sent amount
  const sentAmount = useMemo(() => {
    if (!tokenKey || !fromChain) {
      return <></>;
    }

    const sourceTokenConfig = config.tokens[tokenKey];
    const sourceChainConfig = config.chains[fromChain]!;

    const usdAmount = calculateUSDPrice(
      amount,
      tokenPrices,
      sourceTokenConfig,
      true,
    );

    const senderAddress = sender ? trimAddress(sender) : '';

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
            {amount} {sourceTokenConfig.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {isFetchingTokenPrices ? (
              <CircularProgress size={14} />
            ) : (
              `${usdAmount} \u2022 ${sourceChainConfig.displayName} ${senderAddress}`
            )}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [amount, fromChain, isFetchingTokenPrices, sender, tokenKey, tokenPrices]);

  // Render details for the received amount
  const receivedAmount = useMemo(() => {
    if (!receivedTokenKey || !toChain) {
      return <></>;
    }

    const destTokenConfig = config.tokens[receivedTokenKey];
    const destChainConfig = config.chains[toChain]!;

    const usdAmount = calculateUSDPrice(
      receiveAmount,
      tokenPrices,
      destTokenConfig,
      true,
    );

    const recipientAddress = recipient ? trimAddress(recipient) : '';

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
            {receiveAmount} {destTokenConfig.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {isFetchingTokenPrices ? (
              <CircularProgress size={14} />
            ) : (
              `${usdAmount} \u2022 ${destChainConfig.displayName} ${recipientAddress}`
            )}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [
    isFetchingTokenPrices,
    receiveAmount,
    receivedTokenKey,
    recipient,
    toChain,
    tokenPrices,
  ]);

  // Vertical line that connects sender and receiver token icons
  const verticalConnector = useMemo(
    () => (
      <Stack
        height="32px"
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

    const bridgePrice = calculateUSDPrice(
      relayerFee.fee,
      tokenPrices,
      config.tokens[relayerFee.tokenKey],
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
        {isFetchingTokenPrices ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{bridgePrice}</Typography>
        )}
      </Stack>
    );
  }, [isFetchingTokenPrices, relayerFee, tokenPrices]);

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
      tokenPrices,
      config.tokens[destChainConfig.gasToken],
      true,
    );

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Gas top up
        </Typography>
        {isFetchingTokenPrices ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{gasTokenPrice}</Typography>
        )}
      </Stack>
    );
  }, [isFetchingTokenPrices, receiveNativeAmount, toChain, tokenPrices]);

  const wormscanLink = useMemo(() => {
    const href = `${WORMSCAN}tx/${sendTx}${
      config.isMainnet ? '' : '?network=TESTNET'
    }`;

    return (
      <Stack alignItems="center" padding="24px 12px">
        <Link
          display="flex"
          gap="8px"
          href={href}
          rel="noreferrer"
          target="_blank"
          underline="none"
        >
          <Typography>View on Wormholescan</Typography>
          <LaunchIcon fontSize="small" sx={{ marginTop: '2px' }} />
        </Link>
      </Stack>
    );
  }, [sendTx]);

  const timeToDestination = useMemo(() => {
    let etaDisplay: string | ReactNode = <CircularProgress size={14} />;

    if (eta) {
      etaDisplay = millisToMinutesAndSeconds(eta);
    }

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Time to destination
        </Typography>
        {!eta ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{etaDisplay}</Typography>
        )}
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
          >{`Transaction # ${trimTxHash(sendTx)}`}</Typography>
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
        {wormscanLink}
      </Card>
    </div>
  );
};

export default TransactionDetails;
