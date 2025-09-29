import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroller';
import {
  Box,
  Button,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import Header from 'components/Header';
import ConfigurablePageHeader from 'components/ConfigurablePageHeader';
import useTransactionHistory from 'hooks/useTransactionHistory';
import { trimAddress } from 'utils';
import TxHistoryItem from 'views/v3/TxHistory/Item';

import type { RootState } from 'store';
import { setRoute } from 'store/router';

const TxHistory = () => {
  const dispatch = useDispatch();
  const theme: any = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);

  const { transactions, isFetching, hasMore } = useTransactionHistory({
    page,
  });

  const sendingWallet = useSelector((state: RootState) => state.wallet.sending);

  const styles = useMemo(
    () => ({
      container: {
        maxWidth: '420px',
      },
      containerMobile: {
        display: 'flex',
        flexDirection: 'column',
      },
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },
      infiniteScroller: {
        height: '640px',
        overflow: 'auto',
        width: '100%',
      },
      txHistoryHeader: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      },
      spacer: {
        width: mobile ? '388px' : '420px', // In mobile we don't have the form background that has 16px padding left and right
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }),
    [mobile],
  );

  // Header for Transaction History, which includes the title and settings icon
  const txHistoryHeader = useMemo(() => {
    return (
      <Box sx={styles.txHistoryHeader}>
        <Box>
          <Header align="left" size={18} text="Transaction history" />
        </Box>
        <Button
          variant="text"
          sx={{
            color: theme.palette.text.primary,
            padding: 0,
            textTransform: 'none',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
          onClick={() => dispatch(setRoute('search'))}
        >
          {mobile ? 'Resume' : 'Resume Transaction'}
        </Button>
      </Box>
    );
  }, [dispatch, mobile, styles.txHistoryHeader, theme.palette.text.primary]);

  const transactionList = useMemo(
    () => (
      <Box sx={styles.infiniteScroller}>
        <InfiniteScroll
          hasMore={hasMore}
          loadMore={(p) => setPage(p)}
          useWindow={false}
          style={{ scrollbarWidth: 'thin' }}
        >
          <Box sx={styles.spacer}>
            {transactions?.map((tx, idx) => {
              return <TxHistoryItem key={idx} data={tx} />;
            })}
          </Box>
        </InfiniteScroll>
      </Box>
    ),
    [hasMore, styles.infiniteScroller, styles.spacer, transactions],
  );

  const containerStyles = useMemo(() => {
    return mobile ? styles.containerMobile : styles.container;
  }, [mobile, styles.container, styles.containerMobile]);

  const content = useMemo(() => {
    // Has transactions to display
    if (transactions?.length) {
      return transactionList;
    }

    // Loading state
    if (isFetching || transactions?.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'center',
            width: mobile ? '388px' : '420px', // In mobile we don't have the form background that has 16px padding left and right
          }}
        >
          <Skeleton variant="rounded" height={24} width="100%" />
          <Skeleton variant="rounded" height={48} width="100%" />
          <Skeleton variant="rounded" height={48} width="100%" />
        </Box>
      );
    }

    // No transactions found (after fetch completed)
    if (!isFetching && (!transactions || transactions.length === 0)) {
      return (
        <Typography color={theme.palette.text.secondary} textAlign="center">
          No transactions found for the wallet&nbsp;
          {trimAddress(sendingWallet.address)}
        </Typography>
      );
    }
  }, [
    isFetching,
    transactions,
    transactionList,
    mobile,
    theme.palette.text.secondary,
    sendingWallet.address,
  ]);

  return (
    <Box sx={{ ...containerStyles }}>
      <ConfigurablePageHeader />
      {txHistoryHeader}
      {content}
    </Box>
  );
};

export default React.memo(TxHistory);
