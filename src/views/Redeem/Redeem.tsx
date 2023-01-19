import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../../components/Header';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import { Theme } from '@mui/material';
import redirectIcon from '../../icons/redirect.svg';
import Stepper from './Stepper';

const useStyles = makeStyles((theme: Theme) => ({
  milestoneContent: {
    margin: 'auto',
    maxWidth: '700px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    color: theme.palette.text.primary,
    textDecoration: 'underline',
    margin: '12px',
    display: 'flex',
    alignItems: 'center',
  },
  redirectIcon: {
    marginLeft: '8px',
  },
}));

function Redeem() {
  const classes = useStyles();

  return (
    <div className={classes.milestoneContent}>
      <Header text="Bridge" align="center" />
      <Spacer height={40} />
      <NetworksTag fromNetwork="polygon" toNetwork="fantom" />
      <a className={classes.link} href="https://wormhole.com/" target="_blank" rel="noreferrer">
        <div>View on Wormhole Explorer</div>
        <img
          className={classes.redirectIcon}
          src={redirectIcon}
          alt="open link"
        />
      </a>
      <Stepper />
    </div>
  );
}

export default Redeem;
