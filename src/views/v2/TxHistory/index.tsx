import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroller';
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import PageHeader from 'components/PageHeader';
import type { Alignment } from 'components/Header';
import Header from 'components/Header';
import config from 'config';
import PoweredByIcon from 'icons/PoweredBy';
import useTransactionHistory from 'hooks/useTransactionHistory';
import { setRoute as setAppRoute } from 'store/router';
import { trimAddress } from 'utils';
import TxHistoryItem from 'views/v2/TxHistory/Item';

import type { RootState } from 'store';

const styles = {
  container: {
    margin: 'auto',
    maxWidth: '420px',
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
  },
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
} as const;

const TxHistory = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [page, setPage] = useState(0);

  const { transactions, isFetching, hasMore } = useTransactionHistory({
    page,
  });

  const sendingWallet = useSelector((state: RootState) => state.wallet.sending);

  const header = useMemo(() => {
    const defaults: { text: string; align: Alignment } = {
      text: '',
      align: 'left',
    };

    let headerConfig;

    if (typeof config.ui.pageHeader === 'string') {
      headerConfig = { ...defaults, text: config.ui.pageHeader };
    } else {
      headerConfig = { ...defaults, ...config.ui.pageHeader };
    }

    return <PageHeader title={headerConfig.text} align={headerConfig.align} />;
  }, []);

  // Header for Transaction History, which includes the title and settings icon
  const txHistoryHeader = useMemo(() => {
    return (
      <Box sx={styles.txHistoryHeader}>
        <Header align="left" size={18} text="Transaction history" />
        <IconButton onClick={() => dispatch(setAppRoute('bridge'))}>
          <SwapHorizIcon />
        </IconButton>
      </Box>
    );
  }, [styles.txHistoryHeader, dispatch]);

  const transactionList = useMemo(() => {
    if (!transactions) {
      return <></>;
    } else if (transactions.length === 0) {
      return (
        <Typography color={theme.palette.text.secondary} textAlign="center">
          {`No transactions found for the wallet ${trimAddress(
            sendingWallet.address,
          )}`}
        </Typography>
      );
    }

    return (
      <Box sx={styles.infiniteScroller}>
        <InfiniteScroll
          hasMore={hasMore}
          loadMore={(p) => setPage(p)}
          useWindow={false}
          style={{ scrollbarWidth: 'thin' }}
        >
          <Box sx={styles.spacer}>
            {transactions.map((tx, idx) => {
              return <TxHistoryItem key={idx} data={tx} />;
            })}
          </Box>
        </InfiniteScroll>
      </Box>
    );
  }, [
    styles.infiniteScroller,
    styles.spacer,
    hasMore,
    sendingWallet.address,
    theme.palette.text.secondary,
    transactions,
  ]);

  return (
    <Box sx={{ ...styles.container, ...styles.spacer }}>
      {header}
      {txHistoryHeader}
      {transactionList}
      {(!transactions || isFetching) && <CircularProgress />}
      <PoweredByIcon color={theme.palette.text.primary} />
    </Box>
  );
};

export default TxHistory;
