import React, { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, WalletState } from '@xlabs-libs/wallet-aggregator-core';
import {
  ChainName,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getWallets as getSuiWallets } from '@xlabs-libs/wallet-aggregator-sui';
import { CHAINS } from '../config';
import { RootState } from '../store';
import { setWalletModal } from '../store/router';
import {
  clearWallet,
  connectReceivingWallet,
  connectWallet,
} from '../store/wallet';
import {
  TransferWallet,
  WalletType,
  setWalletConnection,
  wallets,
} from '../utils/wallet';

import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Scroll from '../components/Scroll';
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
  return ready !== WalletState.Unsupported && ready !== WalletState.NotDetected;
};

type WalletData = {
  name: string;
  wallet: Wallet;
  type: WalletType;
  isReady: boolean;
};

const fetchSuiOptions = async () => {
  const suiWallets = await getSuiWallets({ timeout: 0 });
  return suiWallets
    .map<WalletData>((w) => ({
      name: w.getName(),
      wallet: w,
      type: WalletType.SUI, // sui wallets share the same wallet type
      isReady: getReady(w),
    }))
    .reduce((obj, value) => {
      obj[value.name] = value;
      return obj;
    }, {});
};

const mapWallets = (
  wallets: Record<string, Wallet>,
  type: WalletType,
): WalletData[] => {
  return Object.values(wallets).map((wallet) => ({
    name: wallet.getName(),
    wallet,
    type,
    isReady: getReady(wallet),
  }));
};

const getWalletOptions = async (config: any) => {
  if (!config) {
    const suiOptions = await fetchSuiOptions();
    return mapWallets(Object.assign({}, suiOptions, wallets.evm, wallets.solana), WalletType.EVM);
  }
  if (config.context === Context.ETH) {
    return mapWallets(wallets.evm, WalletType.EVM);
  } else if (config.context === Context.SOLANA) {
    return mapWallets(wallets.solana, WalletType.SOLANA);
  } else if (config.context === Context.SUI) {
    const suiOptions = await fetchSuiOptions();
    return mapWallets(suiOptions, WalletType.SUI);
  }
  const suiOptions = await fetchSuiOptions();
  return mapWallets(Object.assign({}, suiOptions, wallets.evm, wallets.solana), WalletType.EVM);
};

// const ALL_WALLETS: WalletData[] =
//   Object
//     .values(Context)
//     .filter(context => !!CHAINS_ARR.find(c => c.context === context))
//     .reduce<WalletData[]>((acc, context) => acc.concat(getWalletOptions(context)), []);

type Props = {
  type: TransferWallet;
  chain?: ChainName;
  onClose?: () => any;
};

function WalletsModal(props: Props) {
  const { classes } = useStyles();
  const theme = useTheme();
  const { chain: chainProp, type } = props;
  const dispatch = useDispatch();
  const { fromNetwork, toNetwork } = useSelector(
    (state: RootState) => state.transfer,
  );

  const [walletOptions, setWalletOptions] = useState<WalletData[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function getAvailableWallets() {
      const chain =
        chainProp ||
        (type === TransferWallet.SENDING ? fromNetwork : toNetwork);

      const config = CHAINS[chain!];
      return await getWalletOptions(config);
    }
    (async () => {
      const options = await getAvailableWallets();
      if (!cancelled && options) {
        setWalletOptions(options);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromNetwork, toNetwork, props.chain, chainProp, type]);

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
      const payload = {
        address,
        type: walletInfo.type,
        icon: wallet.getIcon(),
        wallet: wallet,
      };
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
          <WalletIcon wallet={wallet.wallet} height={32} />
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
      <Scroll
        height="calc(100vh - 175px)"
        blendColor={theme.palette.modal.background}
      >
        <div>{displayWalletOptions(walletOptions)}</div>
      </Scroll>
    </Modal>
  );
}

export default WalletsModal;
