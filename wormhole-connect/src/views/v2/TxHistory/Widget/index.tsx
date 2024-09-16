import React from 'react';
import { Stack, useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import ArrowRight from 'icons/ArrowRight';
import TokenIcon from 'icons/TokenIcons';

import { trimTxHash } from 'utils';
import { Transaction } from 'config/types';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
    boxShadow: `0px 0px 3.5px 0px ${theme.palette.primary.main}`,
  },
  cardHeader: {
    paddingBottom: 0,
  },
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  txHistoryHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
}));

type Props = {
  transactions: Array<Transaction>;
};

const TxHistoryWidget = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const { transactions } = props;

  if (!transactions || transactions.length === 0) {
    return <></>;
  }

  return (
    <div className={classes.spacer}>
      <div className={classes.txHistoryHeader}>
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Transactions in progress
        </Typography>
      </div>
      {transactions.map((tx, idx) => {
        const { txHash, explorerLink, amount, fromChain, toChain, tokenKey } =
          tx;

        return (
          <div key={idx} className={classes.container}>
            <Card className={classes.card}>
              <CardActionArea
                disableTouchRipple
                onClick={() => {
                  window.open(explorerLink, '_blank');
                }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography
                      fontSize={14}
                      justifyContent="space-between"
                      color={theme.palette.text.secondary}
                      display="flex"
                    >
                      <span>{`Transaction # ${trimTxHash(txHash)}`}</span>
                    </Typography>
                    <Stack direction="row" alignItems="center">
                      <TokenIcon
                        icon={config.chains[fromChain]?.icon}
                        height={24}
                      />
                      <ArrowRight fontSize="small" />
                      <TokenIcon
                        icon={config.chains[toChain]?.icon}
                        height={24}
                      />
                      <Typography fontSize={14} marginLeft="8px">
                        {amount} {config.tokens[tokenKey].symbol}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default TxHistoryWidget;
