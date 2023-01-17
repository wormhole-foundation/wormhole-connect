import React from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../components/Header';
import Input from '../components/Input';
import InputContainer from '../components/InputContainer';
import Spacer from '../components/Spacer';
import NetworksModal from './NetworksModal';
import TokensModal from './TokensModal';
import NetworkTile from '../components/NetworkTile';
import ConnectWallet from '../components/ConnectWallet';
import TokenIcon from '../icons/token.svg';
import ArrowIcon from '../icons/arrow.svg';
import { Theme } from '@mui/material';
import MAINNET_CONFIG from '../sdk/config/MAINNET';
import { OPACITY } from '../utils/style';

const useStyles = makeStyles((theme: Theme) => ({
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
  networks: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networksTile: {
    width: '100%',
    maxWidth: '224px',
  },
  networksArrow: {
    width: '48px',
    height: '48px',
    borderRadius: '100%',
    backgroundColor: `${theme.palette.primary[50] + OPACITY[7]}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
}));

const Item1 = () => <div>Select token</div>;

const showNetworksModal = false;
const showTokensModal = true;

function Bridge() {
  const classes = useStyles();
  return (
    <div className={classes.bridgeContent}>
      <Header text="Bridge" align="center" />
      <Spacer height={40} />
      <div className={classes.networks}>
        <div className={classes.networksTile}>
          <NetworkTile title="Sending from" network={MAINNET_CONFIG.chains.polygon} />
          <ConnectWallet />
        </div>
        <div className={classes.networksArrow}>
          <img src={ArrowIcon} alt="arrow right" />
        </div>
        <div className={classes.networksTile}>
          <NetworkTile title="Sending to" network={MAINNET_CONFIG.chains.fantom} />
          <ConnectWallet />
        </div>
      </div>
      <Spacer />
      <InputContainer>
        <div className={classes.tokenSelect}>
          Select token
          <img src={TokenIcon} alt="select token" />
        </div>
      </InputContainer>
      <Spacer />
      <Input left={Item1()} />
      {showNetworksModal && <NetworksModal title="Send from" />}
      {showTokensModal && <TokensModal />}
    </div>
  );
}

export default Bridge;
