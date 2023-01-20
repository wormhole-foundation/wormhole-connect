import React from 'react';
import { makeStyles } from '@mui/styles';
import NetworksModal from '../NetworksModal';
// import NetworkTile from '../../components/NetworkTile';
// import ConnectWallet, { Wallet } from '../../components/ConnectWallet';
// import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Theme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
// import {
//   setFromNetworksModal,
//   setToNetworksModal,
//   setWalletModal,
// } from '../../store/router';
import { setFromNetwork, setToNetwork } from '../../store/transfer';
import { RootState } from '../../store';
// import MAINNET_CONFIG from '../../sdk/config/MAINNET';
import { ChainName } from '../../sdk/types';
import FromNetwork from './FromNetwork';
import ToNetwork from './ToNetwork';

const useStyles = makeStyles((theme: Theme) => ({
  networks: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  networksTile: {
    width: '100%',
    maxWidth: '224px',
    boxShadow: theme.palette.card.elevation,
    borderRadius: '8px',
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
      <FromNetwork />
      <ToNetwork />

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
