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
import { useDispatch, useSelector } from 'react-redux';
import {
  setFromNetworksModal,
  setToNetworksModal,
  setWalletModal,
  setTokensModal,
} from '../store/router';
import { setFromNetwork, setToNetwork } from '../store/transfer';
import { RootState } from '../store';
import MAINNET_CONFIG, { MAINNET_TOKENS } from '../sdk/config/MAINNET';
import { OPACITY } from '../utils/style';
import { ChainName } from '../sdk/types';
import ArrowDownIcon from '../icons/arrow-down.svg';

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
  tokenRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
  },
  tokenRowIcon: {
    width: '32px',
    height: '32px',
    marginRight: '12px',
  },
}));

const Item1 = () => <div>Select token</div>;

function Bridge() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const showFromNetworksModal = useSelector(
    (state: RootState) => state.router.showFromNetworksModal,
  );
  const showToNetworksModal = useSelector(
    (state: RootState) => state.router.showToNetworksModal,
  );
  const showTokensModal = useSelector(
    (state: RootState) => state.router.showTokensModal,
  );
  const fromNetwork = useSelector(
    (state: RootState) => state.transfer.fromNetwork,
  );
  const token = useSelector((state: RootState) => state.transfer.token);
  const tokenConfig = token ? MAINNET_TOKENS[token] : undefined;
  const toNetwork = useSelector((state: RootState) => state.transfer.toNetwork);
  const fromNetworkConfig = MAINNET_CONFIG.chains[fromNetwork];
  const toNetworkConfig = MAINNET_CONFIG.chains[toNetwork];
  const openFromNetworksModal = () => dispatch(setFromNetworksModal(true));
  const openToNetworksModal = () => dispatch(setToNetworksModal(true));
  const openWalletModal = () => dispatch(setWalletModal(true));
  const openTokensModal = () => dispatch(setTokensModal(true));
  const setFromNetworkStore = (network: ChainName) =>
    dispatch(setFromNetwork(network));
  const setToNetworkStore = (network: ChainName) =>
    dispatch(setToNetwork(network));
  // listen for selectFromNetwork
  document.addEventListener(
    'selectFromNetwork',
    (event: Event) => {
      const { detail } = event as CustomEvent;
      setFromNetworkStore(detail);
    },
    { once: true },
  );
  // listen for selectToNetwork
  document.addEventListener(
    'selectToNetwork',
    (event: Event) => {
      const { detail } = event as CustomEvent;
      setToNetworkStore(detail);
    },
    { once: true },
  );

  return (
    <div className={classes.bridgeContent}>
      <Header text="Bridge" align="center" />

      <Spacer height={40} />

      <div className={classes.networks}>
        <div className={classes.networksTile}>
          <NetworkTile
            title="Sending from"
            network={fromNetworkConfig}
            onClick={openFromNetworksModal}
          />
          <ConnectWallet onClick={openWalletModal} />
        </div>
        <div className={classes.networksArrow}>
          <img src={ArrowIcon} alt="arrow right" />
        </div>
        <div className={classes.networksTile}>
          <NetworkTile
            title="Sending to"
            network={toNetworkConfig}
            onClick={openToNetworksModal}
          />
          <ConnectWallet onClick={openWalletModal} />
        </div>
      </div>

      <Spacer />

      <InputContainer onClick={openTokensModal}>
        <div className={classes.tokenSelect}>
          {tokenConfig ? (
            <div className={classes.tokenRow}>
              <img
                className={classes.tokenRowIcon}
                src={tokenConfig!.icon}
                alt={tokenConfig!.symbol}
              />
              <div>{tokenConfig!.symbol}</div>
              <img src={ArrowDownIcon} alt="arrow down" />
            </div>
          ) : (
            'Select token'
          )}
          <img src={TokenIcon} alt="select token" />
        </div>
      </InputContainer>

      <Spacer />

      <Input left={Item1()} />

      {/* modals */}
      {showFromNetworksModal && (
        <NetworksModal title="Send from" event="selectFromNetwork" />
      )}
      {showToNetworksModal && (
        <NetworksModal title="Send to" event="selectToNetwork" />
      )}
      {showTokensModal && <TokensModal />}
    </div>
  );
}

export default Bridge;
