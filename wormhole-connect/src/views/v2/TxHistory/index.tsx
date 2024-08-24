import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { CircularProgress, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import IconButton from '@mui/material/IconButton';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import PageHeader from 'components/PageHeader';
import Header, { Alignment } from 'components/Header';
import config from 'config';
import PoweredByIcon from 'icons/PoweredBy';
import useFetchTransactionHistory from 'hooks/useFetchTransactionHistory';
import { setRoute as setAppRoute } from 'store/router';
import { joinClass } from 'utils/style';

import TxHistoryItem from 'views/v2/TxHistory/Item';

const useStyles = makeStyles()((_theme) => ({
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
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
  txHistoryHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
}));

const TxHistory = () => {
  const dispatch = useDispatch();
  const { classes } = useStyles();
  const theme = useTheme();

  const { transactions, isFetching } = useFetchTransactionHistory();

  const header = useMemo(() => {
    const defaults: { text: string; align: Alignment } = {
      text: '',
      align: 'left',
    };

    let headerConfig;

    if (typeof config.pageHeader === 'string') {
      headerConfig = { ...defaults, text: config.pageHeader };
    } else {
      headerConfig = { ...defaults, ...config.pageHeader };
    }

    return (
      <PageHeader
        title={headerConfig.text}
        align={headerConfig.align}
        showHamburgerMenu={config.showHamburgerMenu}
      />
    );
  }, []);

  // Header for Transaction History, which includes the title and settings icon
  const txHistoryHeader = useMemo(() => {
    return (
      <div className={classes.txHistoryHeader}>
        <Header align="left" text="Transaction history" size={20} />
        <IconButton onClick={() => dispatch(setAppRoute('bridge'))}>
          <SwapHorizIcon />
        </IconButton>
      </div>
    );
  }, []);

  return (
    <div className={joinClass([classes.container, classes.spacer])}>
      {header}
      {txHistoryHeader}
      {isFetching ? (
        <CircularProgress />
      ) : (
        transactions.map((tx) => {
          return <TxHistoryItem data={tx} />;
        })
      )}
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default TxHistory;
