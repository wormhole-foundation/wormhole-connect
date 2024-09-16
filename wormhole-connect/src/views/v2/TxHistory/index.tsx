import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroller';
import { useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import PageHeader from 'components/PageHeader';
import Header, { Alignment } from 'components/Header';
import config from 'config';
import PoweredByIcon from 'icons/PoweredBy';
import useTransactionHistory from 'hooks/useTransactionHistory';
import { setRoute as setAppRoute } from 'store/router';
import { trimAddress } from 'utils';
import { joinClass } from 'utils/style';
import TxHistoryItem from 'views/v2/TxHistory/Item';
import TxHistoryWidget from 'views/v2/TxHistory/Widget';

import type { RootState } from 'store';

const useStyles = makeStyles()((_theme) => ({
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
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
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
}));

const TxHistory = () => {
  const dispatch = useDispatch();
  const { classes } = useStyles();
  const theme = useTheme();

  const [page, setPage] = useState(0);

  const { transactions, isFetching, hasMore } = useTransactionHistory({
    page,
  });

  const sendingWallet = useSelector((state: RootState) => state.wallet.sending);

  const { usdPrices: tokenPrices } = useSelector(
    (state: RootState) => state.tokenPrices,
  );

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

    return (
      <PageHeader
        title={headerConfig.text}
        align={headerConfig.align}
        showHamburgerMenu={config.ui.showHamburgerMenu}
      />
    );
  }, []);

  // Header for Transaction History, which includes the title and settings icon
  const txHistoryHeader = useMemo(() => {
    return (
      <div className={classes.txHistoryHeader}>
        <Header align="left" size={18} text="Transaction history" />
        <IconButton onClick={() => dispatch(setAppRoute('bridge'))}>
          <SwapHorizIcon />
        </IconButton>
      </div>
    );
  }, []);

  const inProgressTransactions = useMemo(() => {
    if (!transactions) {
      return <></>;
    }

    const inProgressTxs = transactions.filter((tx) => tx.inProgress);

    if (inProgressTxs.length === 0) {
      return <></>;
    }

    return <TxHistoryWidget transactions={inProgressTxs.slice(0, 3)} />;
  }, [transactions]);

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
      <div className={joinClass([classes.infiniteScroller])}>
        <InfiniteScroll
          hasMore={hasMore}
          loadMore={(p) => setPage(p)}
          useWindow={false}
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className={joinClass([classes.spacer])}>
            {transactions.map((tx, idx) => {
              return (
                <TxHistoryItem
                  key={idx}
                  data={tx}
                  tokenPrices={tokenPrices.data}
                />
              );
            })}
          </div>
        </InfiniteScroll>
      </div>
    );
  }, [hasMore, sendingWallet.address, tokenPrices.data, transactions]);

  return (
    <div className={joinClass([classes.container, classes.spacer])}>
      {header}
      {inProgressTransactions}
      {txHistoryHeader}
      {transactionList}
      {(!transactions || isFetching) && <CircularProgress />}
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default TxHistory;
