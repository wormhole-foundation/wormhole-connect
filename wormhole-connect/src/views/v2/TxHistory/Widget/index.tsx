import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { TransactionLocal } from 'config/types';
import WidgetItem from 'views/v2/TxHistory/Widget/Item';
import { getTxsFromLocalStorage } from 'utils/inProgressTxCache';

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
    gap: '16px',
    marginBottom: '16px',
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

const TxHistoryWidget = () => {
  const { classes } = useStyles();
  const theme = useTheme();

  const [transactions, setTransactions] = useState<Array<TransactionLocal>>();

  useEffect(() => {
    // Get all in-progress transactions from localStorage
    setTransactions(getTxsFromLocalStorage());
  }, []);

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
      {transactions.map((tx) => (
        <WidgetItem key={tx.txHash} data={tx} />
      ))}
    </div>
  );
};

export default TxHistoryWidget;
