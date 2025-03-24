import { Context, ChainConfig } from 'sdklegacy';
import {
  NotSupported,
  Wallet,
  WalletState,
} from '@xlabs-libs/wallet-aggregator-core';
import {
  connectWallet as connectSourceWallet,
  clearWallet,
  connectReceivingWallet,
} from 'store/wallet';

import config from 'config';
import { getChainByChainId } from 'utils';

import { RootState } from 'store';
import { Dispatch } from 'redux';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Network, Chain, UnsignedTransaction } from '@wormhole-foundation/sdk';

import {
  EvmUnsignedTransaction,
  EvmChains,
} from '@wormhole-foundation/sdk-evm';
import {
  SuiUnsignedTransaction,
  SuiChains,
} from '@wormhole-foundation/sdk-sui';
import {
  AptosUnsignedTransaction,
  AptosChains,
} from '@wormhole-foundation/sdk-aptos';
import { SolanaUnsignedTransaction } from '@wormhole-foundation/sdk-solana';
import { ReadOnlyWallet } from './ReadOnlyWallet';

export enum TransferWallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

const walletConnection = {
  sending: undefined as Wallet | undefined,
  receiving: undefined as Wallet | undefined,
};

export const walletAcceptedChains = (context: Context | undefined): Chain[] => {
  if (!context) {
    return config.chainsArr.map((c) => c.key);
  }
  return config.chainsArr
    .filter((c) => c.context === context)
    .map((c) => c.key);
};

export const setWalletConnection = (type: TransferWallet, wallet: Wallet) => {
  walletConnection[type] = wallet;
};

// Returns false if the wallet connection was rejected by the user
export const connectWallet = async (
  type: TransferWallet,
  chain: Chain,
  walletInfo: WalletData,
  dispatch: Dispatch<any>,
): Promise<boolean> => {
  const { wallet, name } = walletInfo;

  setWalletConnection(type, wallet);

  const chainConfig = config.chains[chain];
  if (!chainConfig) {
    throw new Error(`Unable to find wallets for chain ${chain}`);
  }

  const { chainId, context } = chainConfig;

  try {
    await wallet.connect({ chainId });
  } catch (e: any) {
    if (e.message && e.message.toLowerCase().includes('rejected')) {
      console.info('User rejected wallet connection');
      // If user doesn't want to connect to this wallet, this is not an error we need to throw
      return false;
    } else {
      throw e;
    }
  }

  config.triggerEvent({
    type: 'wallet.connect',
    details: {
      side: type,
      chain: chain,
      wallet: walletInfo.name.toLowerCase(),
    },
  });

  const address = wallet.getAddress()!;
  const payload = {
    address,
    type: walletInfo.type,
    icon: wallet.getIcon(),
    name: wallet.getName(),
  };

  if (type === TransferWallet.SENDING) {
    dispatch(connectSourceWallet(payload));
  } else {
    dispatch(connectReceivingWallet(payload));
  }

  // Clear wallet when the user manually disconnects from outside the app
  wallet.on('disconnect', () => {
    wallet.removeAllListeners();
    // Use setTimeout to defer the dispatch call to the next event loop tick.
    // This ensures that the dispatch does not occur while a reducer is executing,
    // preventing the "You may not call store.getState() while the reducer is executing" error.
    setTimeout(() => {
      dispatch(clearWallet(type));
    }, 0);
    localStorage.removeItem(`wormhole-connect:wallet:${context}`);
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

  if (name !== ReadOnlyWallet.NAME) {
    localStorage.setItem(`wormhole-connect:wallet:${context}`, name);
  }

  return true;
};

// Checks localStorage for previously used wallet for this chain
// and connects to it automatically if it exists.
export const connectLastUsedWallet = async (
  type: TransferWallet,
  chain: Chain,
  dispatch: Dispatch<any>,
) => {
  const chainConfig = config.chains[chain!]!;
  const localStorageKey = `wormhole-connect:wallet:${chainConfig.context}`;
  const lastUsedWallet = localStorage.getItem(localStorageKey);

  // if the last used wallet is not WalletConnect, try to connect to it
  if (lastUsedWallet && lastUsedWallet !== 'WalletConnect') {
    const options = await getWalletOptions(chainConfig);
    const wallet = options.find((w) => w.name === lastUsedWallet);
    if (wallet) {
      try {
        const connected = await connectWallet(type, chain, wallet, dispatch);
        if (!connected) {
          localStorage.removeItem(localStorageKey);
        }
      } catch (e: any) {
        localStorage.removeItem(localStorageKey);
        throw new Error(
          `Failed to autoconnect to wallet ${lastUsedWallet} for ${chain} (${chainConfig.context}): ${e.message}`,
        );
      }
    }
  }
};

export const useConnectToLastUsedWallet = (): void => {
  const dispatch = useDispatch();
  const { toChain, fromChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  useEffect(() => {
    let canceled = false;

    const connect = async () => {
      if (fromChain && !canceled)
        await connectLastUsedWallet(
          TransferWallet.SENDING,
          fromChain,
          dispatch,
        );
      if (toChain && !canceled)
        await connectLastUsedWallet(
          TransferWallet.RECEIVING,
          toChain,
          dispatch,
        );
    };

    connect();

    return () => {
      canceled = true;
    };
  }, [fromChain, toChain]);
};

export const getWalletConnection = (type: TransferWallet) => {
  return walletConnection[type];
};

export const swapWalletConnections = () => {
  const temp = walletConnection.sending;
  walletConnection.sending = walletConnection.receiving;
  walletConnection.receiving = temp;
};

export const registerWalletSigner = async (
  chain: Chain,
  type: TransferWallet,
) => {
  const w = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');
  const signer = await w.getSigner();
  config.whLegacy.registerSigner(chain, signer);
};

export const switchChain = async (
  chainId: number | string,
  type: TransferWallet,
): Promise<string | undefined> => {
  const w: Wallet = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');

  const config = getChainByChainId(chainId)!;
  const currentChain = w.getNetworkInfo().chainId;
  if (currentChain === chainId) return;
  if (config.context === Context.ETH) {
    try {
      // some wallets may not support chain switching
      const evm = await import('utils/wallet/evm');
      await evm.switchChain(w, chainId as number);
    } catch (e) {
      if (e instanceof NotSupported) return;
      throw e;
    }
  }
  return w.getAddress();
};

export const disconnect = async (type: TransferWallet) => {
  const w = walletConnection[type]! as any;
  if (!w) return;
  await w.disconnect();
};

export const signAndSendTransaction = async (
  chain: Chain,
  request: UnsignedTransaction<Network, Chain>,
  walletType: TransferWallet,
  options: any = {},
): Promise<string> => {
  const chainConfig = config.chains[chain]!;

  const wallet = walletConnection[walletType];
  if (!wallet) {
    throw new Error('wallet is undefined');
  }

  if (chainConfig.context === Context.ETH) {
    const evm = await import('utils/wallet/evm');
    const tx = await evm.signAndSendTransaction(
      request as EvmUnsignedTransaction<Network, EvmChains>,
      wallet,
      chain,
      options,
    );
    return tx;
  } else if (chainConfig.context === Context.SOLANA) {
    const solana = await import('utils/wallet/solana');
    const signature = await solana.signAndSendTransaction(
      request as SolanaUnsignedTransaction<Network>,
      wallet,
      options,
    );
    return signature;
  } else if (chainConfig.context === Context.SUI) {
    const sui = await import('utils/wallet/sui');
    const tx = await sui.signAndSendTransaction(
      request as SuiUnsignedTransaction<Network, SuiChains>,
      wallet,
    );
    return tx.id;
  } else if (chainConfig.context === Context.APTOS) {
    const aptos = await import('utils/wallet/aptos');
    const tx = await aptos.signAndSendTransaction(
      request as AptosUnsignedTransaction<Network, AptosChains>,
      wallet,
    );
    return tx.id;
  } else {
    throw new Error('unimplemented');
  }
};

const getReady = (wallet: Wallet) => {
  const ready = wallet.getWalletState();
  return ready !== WalletState.Unsupported && ready !== WalletState.NotDetected;
};

export type WalletData = {
  name: string;
  type: Context;
  icon: string;
  isReady: boolean;
  wallet: Wallet;
};

const mapWallets = (
  wallets: Record<string, Wallet>,
  type: Context,
  skip: string[] = [],
): WalletData[] => {
  return Object.values(wallets)
    .filter(
      (wallet, index, self) =>
        index === self.findIndex((o) => o.getName() === wallet.getName()),
    )
    .filter((wallet) => !skip.includes(wallet.getName()))
    .map((wallet) => ({
      wallet,
      type,
      name: wallet.getName(),
      icon: wallet.getIcon(),
      isReady: getReady(wallet),
    }));
};

export const getWalletOptions = async (
  config: ChainConfig | undefined,
): Promise<WalletData[]> => {
  if (config === undefined) {
    return [];
  } else if (config.context === Context.ETH) {
    const evm = await import('utils/wallet/evm');
    return Object.values(mapWallets(evm.wallets, Context.ETH));
  } else if (config.context === Context.SOLANA) {
    const solana = await import('utils/wallet/solana');
    const solanaWallets = solana.fetchOptions();
    return Object.values(mapWallets(solanaWallets, Context.SOLANA));
  } else if (config.context === Context.SUI) {
    const suiWallet = await import('utils/wallet/sui');
    const suiOptions = await suiWallet.fetchOptions();
    return Object.values(mapWallets(suiOptions, Context.SUI));
  } else if (config.context === Context.APTOS) {
    const aptosWallet = await import('utils/wallet/aptos');
    const aptosOptions = aptosWallet.fetchOptions();
    return Object.values(mapWallets(aptosOptions, Context.APTOS));
  }
  return [];
};
