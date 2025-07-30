import React, { useEffect, useState } from 'react';
import { useTheme, Box } from '@mui/material';
import Typography from '@mui/material/Typography';

import config from 'config';
import type { TransactionLocal } from 'config/types';
import WidgetItem from 'views/v2/TxHistory/Widget/Item';
import { getTxsFromLocalStorage } from 'utils/inProgressTxCache';

const TxHistoryWidget = (props: { disabled: boolean }) => {
  const theme = useTheme();

  const [transactions, setTransactions] = useState<Array<TransactionLocal>>();

  useEffect(() => {
    // Get all in-progress transactions from localStorage
    const txs = getTxsFromLocalStorage();

    // Filter out the ones with unknown tokens
    const verifiedTxs = txs?.filter((tx) => {
      if (!tx?.txDetails?.token) {
        return false;
      }
      try {
        return !!config.tokens.get(tx?.txDetails?.token);
      } catch (e: unknown) {
        console.log(
          `Error while parsing token from local storage (in-progress widget):`,
          e,
        );
        return false;
      }
    });

    setTransactions(verifiedTxs);
  }, []);

  if (!transactions || transactions.length === 0) {
    return <></>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '16px',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Transactions in progress
        </Typography>
      </Box>
      {transactions.map((tx) => (
        <WidgetItem key={tx.txHash} data={tx} disabled={props.disabled} />
      ))}
    </Box>
  );
};

export default TxHistoryWidget;
