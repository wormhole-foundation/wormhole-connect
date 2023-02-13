import { makeStyles } from '@mui/styles';
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import { Theme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setWalletModal } from '../store/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ChainConfig, ChainName, Context } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from '../sdk/config';
import WalletIcon from '../icons/components/WalletIcons';

const useStyles = makeStyles((theme: Theme) => ({
  walletRow: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: '16px',
    padding: '16px 8px',
    transition: `background-color 0.4s`,
    cursor: 'pointer',
    fontSize: '16px',
    '&:hover': {
      backgroundColor: theme.palette.options.select,
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.divider}`,
    },
  },
}));

type Wallet = {
  name: string;
  icon: string;
};
const WALLETS = {
  metamask: {
    name: 'Metamask',
    icon: 'metamask',
  },
  walletConnect: {
    name: 'Wallet Connect',
    icon: 'walletConnect',
  },
  phantom: {
    name: 'Phantom',
    icon: 'phantom',
  },
  solflare: {
    name: 'Solflare',
    icon: 'solflare',
  }
}
const getWalletOptions = (chain: ChainConfig) => {
  if (chain.context === Context.ETH) {
    return [WALLETS.metamask, WALLETS.walletConnect];
  } else if (chain.context === Context.SOLANA) {
    return [WALLETS.phantom, WALLETS.solflare];
  }
}

function NetworksModal() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const fromNetwork = useSelector((state: RootState) => state.transfer.fromNetwork);
  const [walletOptions, setWalletOptions] = useState(Object.values(WALLETS));

  useEffect(() => {
    const config = CHAINS[fromNetwork!];
    if (!config) return;
    const options = getWalletOptions(config);
    if (options) setWalletOptions(options);
  }, []);

  const displayWalletOptions = (wallets: Wallet[]): JSX.Element[] => {
    return wallets.map((wallet, i) => (
      <div className={classes.walletRow} key={i}>
        <WalletIcon name={wallet.icon} height={32} />
        <div>{wallet.name}</div>
      </div>
    ));
  };
  const closeWalletModal = () => {
    dispatch(setWalletModal(false));
    document.removeEventListener('click', closeWalletModal);
  };
  document.addEventListener('close', closeWalletModal, { once: true });
  const showWalletModal = useSelector(
    (state: RootState) => state.router.showWalletModal,
  );

  return (
    <Modal open={showWalletModal} closable width={500}>
      <Header text="Connect wallet" align="left" />
      <Spacer height={32} />
      <div>{displayWalletOptions(walletOptions)}</div>
    </Modal>
  );
}

export default NetworksModal;
