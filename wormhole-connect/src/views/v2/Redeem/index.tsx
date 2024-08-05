import React, { useMemo } from 'react';
import { useTheme } from '@mui/material';
import Stack from '@mui/material/Stack';
import { makeStyles } from 'tss-react/mui';

import PageHeader from 'components/PageHeader';
import { Alignment } from 'components/Header';
import config from 'config';
import PoweredByIcon from 'icons/PoweredBy';
import { joinClass } from 'utils/style';
import TransactionDetails from 'views/v2/Redeem/TransactionDetails';

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
    maxWidth: '650px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
}));

const Redeem = () => {
  const { classes } = useStyles();
  const theme = useTheme();

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

  // Header showing the status of the transaction
  const statusHeader = useMemo(() => {
    return <Stack>Transaction submitted</Stack>;
  }, []);

  const etaProgress = useMemo(() => {
    return <>[ETA progress bar]</>;
  }, []);

  return (
    <div className={joinClass([classes.container, classes.spacer])}>
      {header}
      {statusHeader}
      {etaProgress}
      <TransactionDetails />
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default Redeem;
