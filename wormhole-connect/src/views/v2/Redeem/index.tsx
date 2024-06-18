import React, { useMemo } from 'react';
import { makeStyles } from 'tss-react/mui';
import config from 'config';
import { joinClass } from 'utils/style';

import { useTheme } from '@mui/material';
import PageHeader from 'components/PageHeader';
import PoweredByIcon from 'icons/PoweredBy';
import { Alignment } from 'components/Header';
import FooterNavBar from 'components/FooterNavBar';

const useStyles = makeStyles()((_theme) => ({
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bridgeContent: {
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

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      {header}
      {config.showHamburgerMenu ? null : <FooterNavBar />}

      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default Redeem;
