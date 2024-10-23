import React, { useMemo } from 'react';
import { useTheme } from '@mui/material';
import Badge from '@mui/material/Badge';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import TokenIcon from 'icons/TokenIcons';
import {
  calculateUSDPrice,
  getUSDFormat,
  millisToRelativeTime,
  trimTxHash,
} from 'utils';

import type { Transaction } from 'config/types';
import type { TokenPrices } from 'store/tokenPrices';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
  },
  cardHeader: {
    paddingBottom: 0,
  },
}));

type Props = {
  data: Transaction;
  tokenPrices: TokenPrices | null;
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
    senderTimestamp,
    explorerLink,
  } = props.data;

  // Render details for the sent amount
  const sentAmount = useMemo(() => {
    const sourceTokenConfig = config.tokens[tokenKey];
    const sourceChainConfig = config.chains[fromChain]!;

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
            {`${getUSDFormat(amountUsd)} \u2022 ${
              sourceChainConfig?.displayName
            }`}
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

    const receiveAmountPrice = calculateUSDPrice(
      parseFloat(receiveAmount),
      props.tokenPrices,
      destTokenConfig,
    );

    const receiveAmountDisplay = receiveAmountPrice
      ? `${receiveAmountPrice} \u2022 `
      : '';

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
            {`${receiveAmountDisplay}${destChainConfig?.displayName}`}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [props.tokenPrices, receiveAmount, receivedTokenKey, recipient, toChain]);

  // Vertical line that connects sender and receiver token icons
  const verticalConnector = useMemo(
    () => (
      <Stack
        height="24px"
        borderLeft="1px solid #8B919D"
        marginLeft="16px"
      ></Stack>
    ),
    [],
  );

  const transactionDateTime = useMemo(() => {
    if (!senderTimestamp) {
      return 'Unknown time';
    }

    const senderDate = new Date(senderTimestamp);

    // If it's been less than a day, show relative time
    const timePassed = Date.now() - senderDate.getTime();
    if (timePassed < 1000 * 60 * 60 * 24) {
      return millisToRelativeTime(timePassed);
    }

    const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return `${dateTimeFormat.format(senderDate)}`;
  }, [senderTimestamp]);

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardActionArea
          disableTouchRipple
          onClick={() => {
            window.open(explorerLink, '_blank');
          }}
        >
          <CardHeader
            className={classes.cardHeader}
            title={
              <Typography
                justifyContent="space-between"
                color={theme.palette.text.secondary}
                display="flex"
              >
                <span>{`Transaction #${trimTxHash(txHash)}`}</span>
                <span>{transactionDateTime}</span>
              </Typography>
            }
          />
          <CardContent>
            {sentAmount}
            {verticalConnector}
            {receivedAmount}
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
};

export default TxHistoryItem;
