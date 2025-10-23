import React, { useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import type { Transaction } from 'config/types';
import TxHistoryItem from 'views/v3/TxHistory/Item';

interface TransactionListProps {
  transactions: Array<Transaction> | undefined;
  hasMore: boolean;
  setPage: (page: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  hasMore,
  setPage,
}) => {
  const theme: any = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const styles = useMemo(
    () => ({
      infiniteScroller: {
        height: '640px',
        overflow: 'auto',
        width: '100%',
        scrollbarWidth: 'thin',
      },
      spacer: {
        width: mobile ? '388px' : '420px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }),
    [mobile],
  );

  return (
    <Box sx={styles.infiniteScroller}>
      <InfiniteScroll
        hasMore={hasMore}
        loadMore={(p) => setPage(p)}
        useWindow={false}
      >
        <Box sx={styles.spacer}>
          {transactions?.map((tx, idx) => {
            return <TxHistoryItem key={idx} data={tx} />;
          })}
        </Box>
      </InfiniteScroll>
    </Box>
  );
};

export default React.memo(TransactionList);
