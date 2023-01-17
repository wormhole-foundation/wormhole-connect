import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../components/Header';
import Input from '../components/Input';
import InputContainer from '../components/InputContainer';
import Spacer from '../components/Spacer';
import NetworksModal from './NetworksModal';
import token from '../icons/token.svg';

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
  tokenSelect: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

const Item1 = () => <div>Select token</div>;

const showModal = true;

function Bridge() {
  const classes = useStyles();
  return (
    <div className={classes.bridgeContent}>
      <Header text="Bridge" align="center" />
      <Spacer height={40} />
      <InputContainer>
        <div className={classes.tokenSelect}>
          Select token
          <img src={token} alt="select token" />
        </div>
      </InputContainer>
      <Spacer />
      <Input left={Item1()} />
      { showModal && <NetworksModal title="Send from" /> }
    </div>
  );
}

export default Bridge;
