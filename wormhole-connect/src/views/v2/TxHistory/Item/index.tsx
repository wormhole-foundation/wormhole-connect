import React, { useMemo } from 'react';
import LaunchIcon from '@mui/icons-material/Launch';
import { useTheme } from '@mui/material';
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
import TokenIcon from 'icons/TokenIcons';
import { trimAddress, trimTxHash } from 'utils';

import type { Transaction } from 'hooks/useFetchTransactionHistory';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
  },
}));

type Props = {
  data: Transaction;
};

const TxHistoryItem = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const {
    txHash,
    sender,
    amount,
    amountUsd,
    recipient,
    toChain,
    fromChain,
    tokenKey,
    receivedTokenKey,
    receiveAmount,
    receiveNativeAmount,
    relayerFee,
  } = props.data;

  // Render details for the sent amount
  const sentAmount = useMemo(() => {
    const sourceTokenConfig = config.tokens[tokenKey];
    const sourceChainConfig = config.chains[fromChain]!;

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
            {amount} {sourceTokenConfig?.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {`${amountUsd} \u2022 ${sourceChainConfig?.displayName} ${senderAddress}`}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [amount, fromChain, sender, tokenKey]);

  // Render details for the received amount
  const receivedAmount = useMemo(() => {
    const destChainConfig = config.chains[toChain]!;
    const destTokenConfig = receivedTokenKey
      ? config.tokens[receivedTokenKey]
      : undefined;

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
            {receiveAmount} {destTokenConfig?.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {`${destChainConfig?.displayName} ${recipientAddress}`}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [receiveAmount, receivedTokenKey, recipient, toChain]);

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

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Bridge fee
        </Typography>
        <Typography fontSize={14}>{relayerFee.fee}</Typography>
      </Stack>
    );
  }, [relayerFee]);

  const destinationGas = useMemo(() => {
    if (!receiveNativeAmount) {
      return <></>;
    }

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Gas top up
        </Typography>
        <Typography fontSize={14}>{receiveNativeAmount}</Typography>
      </Stack>
    );
  }, [receiveNativeAmount]);

  const wormscanLink = useMemo(() => {
    const href = `${WORMSCAN}tx/${txHash}${
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
  }, [txHash]);

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardContent>
          <Typography
            color={theme.palette.text.secondary}
            marginBottom="12px"
          >{`Transaction # ${trimTxHash(txHash)}`}</Typography>
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
          </Stack>
        </CardContent>
        <Divider flexItem sx={{ margin: '0 16px', opacity: '50%' }} />
        {wormscanLink}
      </Card>
    </div>
  );
};

export default TxHistoryItem;
