import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Button, useMediaQuery, useTheme } from '@mui/material';

import Header from 'components/Header';
import ConfigurablePageHeader from 'components/ConfigurablePageHeader';
import useTransactionHistory from 'hooks/useTransactionHistory';
import TransactionListContent from './TransactionListContent';

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
      txHistoryHeader: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      },
    }),
    [],
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

  const containerStyles = useMemo(() => {
    return mobile ? styles.containerMobile : styles.container;
  }, [mobile, styles.container, styles.containerMobile]);

  return (
    <Box sx={{ ...containerStyles }}>
      <ConfigurablePageHeader />
      {txHistoryHeader}
      <TransactionListContent
        transactions={transactions}
        isFetching={isFetching}
        hasMore={hasMore}
        setPage={setPage}
        sendingWallet={sendingWallet}
      />
    </Box>
  );
};

export default React.memo(TxHistory);
