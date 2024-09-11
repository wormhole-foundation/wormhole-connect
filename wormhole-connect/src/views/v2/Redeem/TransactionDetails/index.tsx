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
import { RouteContext } from 'contexts/RouteContext';
import TokenIcon from 'icons/TokenIcons';
import {
  calculateUSDPrice,
  millisToHumanString,
  trimAddress,
  trimTxHash,
} from 'utils';
import { getExplorerLink } from 'utils/sdkv2';

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
      true,
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
              `${usdAmount} \u2022 ${sourceChainConfig.displayName} ${senderAddress}`
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
      true,
    );

    const recipientAddress = recipient ? trimAddress(recipient) : '';

    const formattedReceiveAmount = formatStringAmount(receiveAmount);
    console.log(receiveAmount);
    console.log(formattedReceiveAmount);

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
              `${usdAmount} \u2022 ${destChainConfig.displayName} ${recipientAddress}`
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

    const feeTokenConfig = config.tokens[relayerFee.tokenKey];
    if (!feeTokenConfig) {
      return <></>;
    }

    const feePrice = calculateUSDPrice(
      relayerFee.fee,
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
        {tokenPrices.isFetching ? (
          <CircularProgress size={14} />
        ) : (
          <Typography fontSize={14}>{`${toFixedDecimals(
            relayerFee.fee.toString(),
            4,
          )} ${feeTokenConfig.symbol} (${feePrice})`}</Typography>
        )}
      </Stack>
    );
  }, [relayerFee, tokenPrices]);

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
      true,
    );

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Gas top up
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
    if (routeContext.route) {
      const { name, url } = getExplorerLink(routeContext.route, sendTx);
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
            <Typography>{name}</Typography>
            <LaunchIcon fontSize="small" sx={{ marginTop: '2px' }} />
          </Link>
        </Stack>
      );
    } else {
      return null;
    }
  }, [sendTx, routeContext.route]);

  const timeToDestination = useMemo(() => {
    let etaDisplay: string | ReactNode = <CircularProgress size={14} />;

    if (eta) {
      etaDisplay = millisToHumanString(eta);
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
        {explorerLink}
      </Card>
    </div>
  );
};

export default TransactionDetails;
