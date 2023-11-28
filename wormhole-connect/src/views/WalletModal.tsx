import React, { ChangeEvent, useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, WalletState } from '@xlabs-libs/wallet-aggregator-core';
import {
  SuiWallet,
  getWallets as getSuiWallets,
} from '@xlabs-libs/wallet-aggregator-sui';
import {
  SeiChainId,
  SeiWallet,
  getSupportedWallets as getSeiWallets,
} from '@xlabs-libs/wallet-aggregator-sei';
import {
  ChainConfig,
  ChainName,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAIN_ID_EVMOS } from '@certusone/wormhole-sdk';

import { CHAINS, CHAINS_ARR, ENV, RPCS } from 'config';
import { RootState } from 'store';
import { setWalletModal } from 'store/router';
import {
  clearWallet,
  connectReceivingWallet,
  connectWallet,
} from 'store/wallet';
import { TransferWallet, setWalletConnection, wallets } from 'utils/wallet';
import { CENTER } from 'utils/style';
import { getSeiChainId } from 'utils/sei';

import Header from 'components/Header';
import Modal from 'components/Modal';
import Spacer from 'components/Spacer';
import Scroll from 'components/Scroll';
import WalletIcon from 'icons/WalletIcons';
import Search from 'components/Search';

const useStyles = makeStyles()((theme: any) => ({
  walletRow: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
  walletRowLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
  },
  context: {
    opacity: '0.6',
  },
  notInstalled: {
    opacity: '60%',
  },
  noResults: {
    ...CENTER,
    minHeight: '72px',
    maxWidth: '350px',
    margin: 'auto',
    flexDirection: 'column',
    marginBottom: '10px',
    gap: '8px',
  },
  noResultsTitle: {
    fontSize: '20px',
    fontWeight: '600',
  },
}));

const getReady = (wallet: Wallet) => {
  const ready = wallet.getWalletState();
  return ready !== WalletState.Unsupported && ready !== WalletState.NotDetected;
};

type WalletData = {
  name: string;
  type: Context;
  icon: string;
  isReady: boolean;
  wallet: Wallet;
};

const fetchSuiOptions = async () => {
  const suiWallets = await getSuiWallets({ timeout: 0 });
  return suiWallets.reduce((obj: { [key: string]: SuiWallet }, value) => {
    obj[value.getName()] = value;
    return obj;
  }, {});
};

const fetchSeiOptions = async () => {
  const seiWallets = await getSeiWallets({
    chainId: getSeiChainId(ENV) as SeiChainId,
    rpcUrl: RPCS.sei || '',
  });

  return seiWallets.reduce((obj: { [key: string]: SeiWallet }, value) => {
    obj[value.getName()] = value;
    return obj;
  }, {});
};

const mapWallets = (
  wallets: Record<string, Wallet>,
  type: Context,
): WalletData[] => {
  return Object.values(wallets).map((wallet) => ({
    wallet,
    type,
    name: wallet.getName(),
    icon: wallet.getIcon(),
    isReady: getReady(wallet),
  }));
};

const getWalletOptions = async (
  config: ChainConfig | undefined,
): Promise<WalletData[]> => {
  if (!config) {
    const suiOptions = await fetchSuiOptions();
    const seiOptions = await fetchSeiOptions();

    const allWallets: Partial<Record<Context, Record<string, Wallet>>> = {
      [Context.ETH]: wallets.evm,
      [Context.SOLANA]: wallets.solana,
      [Context.SUI]: suiOptions,
      [Context.APTOS]: wallets.aptos,
      [Context.SEI]: seiOptions,
      [Context.COSMOS]: wallets.cosmos,
    };
    // filter allWallets that are not supported by network list config
    const networkContext = CHAINS_ARR.map((chain) => chain.context);
    const set = new Set(networkContext);
    console.log(set, Object.keys(allWallets));
    Object.keys(allWallets).forEach((context) => {
      if (!set.has(context as Context)) {
        delete allWallets[context as Context];
      }
    });

    return Object.keys(allWallets)
      .map((value: string) =>
        mapWallets(allWallets[value as Context]!, value as Context),
      )
      .reduce((acc, arr) => acc.concat(arr), []);
  }
  if (config.context === Context.ETH) {
    return Object.values(mapWallets(wallets.evm, Context.ETH));
  } else if (config.context === Context.SOLANA) {
    return Object.values(mapWallets(wallets.solana, Context.SOLANA));
  } else if (config.context === Context.SUI) {
    const suiOptions = await fetchSuiOptions();
    return Object.values(mapWallets(suiOptions, Context.SUI));
  } else if (config.context === Context.APTOS) {
    return Object.values(mapWallets(wallets.aptos, Context.APTOS));
  } else if (config.context === Context.SEI) {
    const suiOptions = await fetchSeiOptions();
    return Object.values(mapWallets(suiOptions, Context.SEI));
  } else if (
    config.context === Context.COSMOS &&
    config.id !== CHAIN_ID_EVMOS
  ) {
    return Object.values(mapWallets(wallets.cosmos, Context.COSMOS));
  } else if (
    config.context === Context.COSMOS &&
    config.id === CHAIN_ID_EVMOS
  ) {
    return Object.values(mapWallets(wallets.cosmosEvm, Context.COSMOS));
  }
  return [];
};

type Props = {
  type: TransferWallet;
  chain?: ChainName;
  onClose?: () => any;
};

function WalletsModal(props: Props) {
  const { classes } = useStyles();
  const theme: any = useTheme();
  const { chain: chainProp, type } = props;
  const dispatch = useDispatch();
  const { fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const [walletOptions, setWalletOptions] = useState<WalletData[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function getAvailableWallets() {
      const chain =
        chainProp || (type === TransferWallet.SENDING ? fromChain : toChain);

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
  }, [fromChain, toChain, props.chain, chainProp, type]);

  const handleSearch = (
    e:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | undefined,
  ) => {
    if (!e) return;
    const lowercase = e.target.value.toLowerCase();
    setSearch(lowercase);
  };

  const connect = async (walletInfo: WalletData) => {
    const { wallet } = walletInfo;

    const chain = type === TransferWallet.SENDING ? fromChain : toChain;
    const chainId = chain ? CHAINS[chain]?.chainId : undefined;
    await wallet.connect({ chainId });

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
        name: wallet.getName(),
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
    const filtered = !search
      ? sorted
      : sorted.filter((w) => w.name && w.name.toLowerCase().includes(search));
    return filtered.map((wallet, i) => {
      const ready = wallet.isReady;
      const select = ready
        ? () => connect(wallet)
        : () => window.open(wallet.wallet.getUrl());
      return (
        <div className={classes.walletRow} key={i} onClick={select}>
          <div className={classes.walletRowLeft}>
            <WalletIcon name={wallet.name} icon={wallet.icon} height={32} />
            <div className={`${!ready && classes.notInstalled}`}>
              {!ready && 'Install'} {wallet.name}
            </div>
          </div>
          <div className={classes.context}>{wallet.type.toUpperCase()}</div>
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
      <Search placeholder="Search" onChange={handleSearch} />
      <Spacer height={16} />
      <Scroll
        height="calc(100vh - 250px)"
        blendColor={theme.palette.modal.background}
      >
        {walletOptions.length > 0 ? (
          <div>{displayWalletOptions(walletOptions)}</div>
        ) : (
          <div className={classes.noResults}>
            <div className={classes.noResultsTitle}>No wallets detected</div>
            <div>Install a wallet extension to continue</div>
          </div>
        )}
      </Scroll>
    </Modal>
  );
}

export default WalletsModal;
