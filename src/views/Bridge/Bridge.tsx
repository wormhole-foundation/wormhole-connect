import React from 'react';
import Header from '../../components/Header';
import Spacer from '../../components/Spacer';
import Networks from './Networks';
import GasOptions from './GasOptions';
import GasSlider from './NativeGasSlider';
import TransferSummary from './TransferSummary';
import Send from './Send';
import { makeStyles } from 'tss-react/mui';
import Menu from '../../components/Menu';

const useStyles = makeStyles()((theme) => ({
  bridgeContent: {
    margin: 'auto',
    maxWidth: '650px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
}));

function Bridge() {
  const { classes } = useStyles();

  return (
    <div className={classes.bridgeContent}>
      <div className={classes.header}>
        <Header text="Bridge" align="left" />
        <Menu />
      </div>
      <Spacer height={40} />

      <Networks />
      <Spacer />

      <GasOptions />
      <Spacer />

      <GasSlider />
      <Spacer />

      <TransferSummary />
      <Spacer />

      <Send />
      <Spacer height={60} />
    </div>
  );
}

export default Bridge;
