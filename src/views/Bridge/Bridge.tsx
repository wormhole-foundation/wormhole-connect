import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Spacer from '../../components/Spacer';
import Token from './Token';
import Networks from './Networks';

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

const Item1 = () => <div>Select token</div>;

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

      <Input left={Item1()} />
    </div>
  );
}

export default Bridge;
