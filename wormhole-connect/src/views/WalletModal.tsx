import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import { Theme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setWalletModal } from '../store/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  ChainConfig,
  ChainName,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import { CHAINS } from '../sdk/config';
import { setWalletConnection, TransferWallet, wallets } from '../utils/wallet';
import {
  connectReceivingWallet,
  connectWallet,
  WalletType,
} from '../store/wallet';
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

type WalletData = {
  name: string;
  wallet: Wallet;
  type: WalletType;
};
const WALLETS = {
  metamask: {
    name: 'Metamask',
    wallet: wallets.evm.metamask,
    type: WalletType.METAMASK,
  },
  walletConnect: {
    name: 'Wallet Connect',
    wallet: wallets.evm.walletConnect,
    type: WalletType.WALLET_CONNECT,
  },
  phantom: {
    name: 'Phantom',
    wallet: wallets.solana.phantom,
    type: WalletType.PHANTOM,
  },
  solflare: {
    name: 'Solflare',
    wallet: wallets.solana.solflare,
    type: WalletType.SOLFLARE,
  },
};
const getWalletOptions = (chain: ChainConfig) => {
  if (chain.context === Context.ETH) {
    return [WALLETS.metamask, WALLETS.walletConnect];
  } else if (chain.context === Context.SOLANA) {
    return [WALLETS.phantom, WALLETS.solflare];
  }
};

type Props = {
  type: TransferWallet;
  chain?: ChainName;
  onClose?: () => any;
};

function WalletsModal(props: Props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { fromNetwork, toNetwork } = useSelector(
    (state: RootState) => state.transfer,
  );
  const [walletOptions, setWalletOptions] = useState(getAvailableWallets());

  function getAvailableWallets() {
    const chain =
      props.chain || props.type === TransferWallet.SENDING
        ? fromNetwork
        : toNetwork;

    const config = CHAINS[chain!];
    if (!config) return Object.values(WALLETS);
    return getWalletOptions(config);
  }
  
  useEffect(() => {
    const options = getAvailableWallets();
    if (options) setWalletOptions(options);
  }, [fromNetwork, toNetwork, props.chain]);

  const connect = async (walletInfo: WalletData) => {
    const { wallet } = walletInfo;
    await wallet.connect();
    setWalletConnection(props.type, wallet);
    const address = wallet.getAddress();
    if (address) {
      const payload = { address, type: walletInfo.type };
      if (props.type === TransferWallet.SENDING) {
        dispatch(connectWallet(payload));
      } else {
        dispatch(connectReceivingWallet(payload));
      }
      dispatch(setWalletModal(false));
      if (props.onClose) props.onClose();
    }
  };

  const displayWalletOptions = (wallets: WalletData[]): JSX.Element[] => {
    return wallets.map((wallet, i) => (
      <div
        className={classes.walletRow}
        key={i}
        onClick={() => connect(wallet)}
      >
        <WalletIcon type={wallet.type} height={32} />
        <div>{wallet.name}</div>
      </div>
    ));
  };
  const closeWalletModal = () => {
    if (props.onClose) {
      props.onClose();
    } else {
      dispatch(setWalletModal(false));
    }
  };

  return (
    <Modal open={!!props.type} closable width={500} onClose={closeWalletModal}>
      <Header text="Connect wallet" align="left" />
      <Spacer height={32} />
      <div>{displayWalletOptions(walletOptions)}</div>
    </Modal>
  );
}

export default WalletsModal;
