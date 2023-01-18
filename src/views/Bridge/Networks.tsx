import React from 'react';
import { makeStyles } from '@mui/styles';
import NetworksModal from '../NetworksModal';
import NetworkTile from '../../components/NetworkTile';
import ConnectWallet from '../../components/ConnectWallet';
import ArrowIcon from '../../icons/arrow.svg';
import { Theme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  setFromNetworksModal,
  setToNetworksModal,
  setWalletModal,
} from '../../store/router';
import { setFromNetwork, setToNetwork } from '../../store/transfer';
import { RootState } from '../../store';
import MAINNET_CONFIG from '../../sdk/config/MAINNET';
import { OPACITY } from '../../utils/style';
import { ChainName } from '../../sdk/types';

const useStyles = makeStyles((theme: Theme) => ({
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

function Networks() {
  const classes = useStyles();
  const dispatch = useDispatch();
  // store values
  const showFromNetworksModal = useSelector(
    (state: RootState) => state.router.showFromNetworksModal,
  );
  const showToNetworksModal = useSelector(
    (state: RootState) => state.router.showToNetworksModal,
  );
  const fromNetwork = useSelector(
    (state: RootState) => state.transfer.fromNetwork,
  );
  const toNetwork = useSelector((state: RootState) => state.transfer.toNetwork);
  // get networks configs
  const fromNetworkConfig = MAINNET_CONFIG.chains[fromNetwork];
  const toNetworkConfig = MAINNET_CONFIG.chains[toNetwork];
  // set store values
  const openFromNetworksModal = () => dispatch(setFromNetworksModal(true));
  const openToNetworksModal = () => dispatch(setToNetworksModal(true));
  const openWalletModal = () => dispatch(setWalletModal(true));
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

      {/* modals */}
      {showFromNetworksModal && (
        <NetworksModal title="Send from" event="selectFromNetwork" />
      )}
      {showToNetworksModal && (
        <NetworksModal title="Send to" event="selectToNetwork" />
      )}
    </div>
  );
}

export default Networks;
