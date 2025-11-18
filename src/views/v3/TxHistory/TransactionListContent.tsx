import React, { useMemo } from 'react';
import {
  Box,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import type { Transaction } from 'config/types';
import type { WalletData } from 'store/wallet';
import { trimAddress } from 'utils';
import TransactionList from './TransactionList';

interface TransactionContentProps {
  transactions: Array<Transaction> | undefined;
  isFetching: boolean;
  hasMore: boolean;
  setPage: (page: number) => void;
  sendingWallet: WalletData;
}

const TransactionContent: React.FC<TransactionContentProps> = ({
  transactions,
  isFetching,
  hasMore,
  setPage,
  sendingWallet,
}) => {
  const theme: any = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const styles = useMemo(
    () => ({
      loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
        width: mobile ? '388px' : '456px',
      },
    }),
    [mobile],
  );

  if (transactions?.length) {
    return (
      <TransactionList
        transactions={transactions}
        hasMore={hasMore}
        setPage={setPage}
      />
    );
  }

  if (isFetching || transactions?.length === 0) {
    return (
      <Box sx={styles.loadingContainer}>
        <Skeleton variant="rounded" height={24} width="100%" />
        <Skeleton variant="rounded" height={48} width="100%" />
        <Skeleton variant="rounded" height={48} width="100%" />
      </Box>
    );
  }

  if (!isFetching && (!transactions || transactions.length === 0)) {
    return (
      <Typography color={theme.palette.text.secondary} textAlign="center">
        No transactions found for the wallet&nbsp;
        {trimAddress(sendingWallet.address)}
      </Typography>
    );
  }

  return null;
};

export default React.memo(TransactionContent);
