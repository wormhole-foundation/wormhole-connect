import React, { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, WalletState } from '@xlabs-libs/wallet-aggregator-core';
import {
  ChainConfig,
  ChainName,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../store';
import { setWalletModal } from '../store/router';
import { CHAINS } from '../config';
import {
  setWalletConnection,
  TransferWallet,
  wallets,
  WalletType,
} from '../utils/wallet';
import {
  clearWallet,
  connectReceivingWallet,
  connectWallet,
} from '../store/wallet';

import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import WalletIcon from '../icons/WalletIcons';

const useStyles = makeStyles()((theme) => ({
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
  notInstalled: {
    opacity: '60%',
  },
}));

const getReady = (wallet: Wallet) => {
  const ready = wallet.getWalletState();
  return ready !== WalletState.Unsupported;
};

type WalletData = {
  name: string;
  wallet: Wallet;
  type: WalletType;
  isReady: boolean;
};
const WALLETS = {
  metamask: {
    name: 'Metamask',
    wallet: wallets.evm.metamask,
    type: WalletType.METAMASK,
    isReady: getReady(wallets.evm.metamask),
  },
  walletConnect: {
    name: 'Wallet Connect',
    wallet: wallets.evm.walletConnect,
    type: WalletType.WALLET_CONNECT,
    isReady: getReady(wallets.evm.walletConnect),
  },
  phantom: {
    name: 'Phantom',
    wallet: wallets.solana.phantom,
    type: WalletType.PHANTOM,
    isReady: getReady(wallets.solana.phantom),
  },
  solflare: {
    name: 'Solflare',
    wallet: wallets.solana.solflare,
    type: WalletType.SOLFLARE,
    isReady: getReady(wallets.solana.solflare),
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
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const { fromNetwork, toNetwork } = useSelector(
    (state: RootState) => state.transfer,
  );
  const [walletOptions, setWalletOptions] = useState(
    getAvailableWallets() || [],
  );

  function getAvailableWallets() {
    const chain =
      props.chain ||
      (props.type === TransferWallet.SENDING ? fromNetwork : toNetwork);

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

    // clear wallet when the user manually disconnects from outside the app
    wallet.on('disconnect', () => {
      wallet.removeAllListeners();
      dispatch(clearWallet(props.type));
    });

    // when the user has multiple wallets connected and either changes
    // or disconnects the current wallet, clear the wallet
    wallet.on('accountsChanged', (accs: string[]) => {
      // disconnect only if there are no accounts, or if the new account is different from the current
      const shouldDisconnect =
        accs.length === 0 || (accs.length && address && accs[0] !== address);

      if (shouldDisconnect) {
        wallet.disconnect();
      }
    });

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
    const sorted = wallets.sort((w) => (w.isReady ? -1 : 1));
    return sorted.map((wallet, i) => {
      const ready = wallet.isReady;
      const select = ready
        ? () => connect(wallet)
        : () => window.open(wallet.wallet.getUrl());
      return (
        <div className={classes.walletRow} key={i} onClick={select}>
          <WalletIcon type={wallet.type} height={32} />
          <div className={`${!ready && classes.notInstalled}`}>
            {!ready && 'Install'} {wallet.name}
          </div>
        </div>
      );
    });
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
      <Header text="Connect wallet" size={28} />
      <Spacer height={16} />
      <div>{displayWalletOptions(walletOptions)}</div>
    </Modal>
  );
}

export default WalletsModal;
