import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../../components/Header';
import Spacer from '../../components/Spacer';
import Networks from './Networks';
import Token from './Token';
import GasOptions from './GasOptions';

const useStyles = makeStyles(() => ({
  bridgeContent: {
    margin: 'auto',
    maxWidth: '650px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function Bridge() {
  const classes = useStyles();

  return (
    <div className={classes.bridgeContent}>
      <Header text="Bridge" align="center" />

      <Spacer height={40} />

      <Networks />

      <Spacer />

      <Token />

      <Spacer />

      <GasOptions />
    </div>
  );
}

export default Bridge;
