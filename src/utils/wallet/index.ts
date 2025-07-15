import { ChainConfig } from 'config/types';
import { WalletType, TransactionRequest } from 'config/externalWallet';
import { Wallet, WalletState } from '@wormhole-labs/wallet-aggregator-core';
import {
  connectWallet as connectSourceWallet,
  clearWallet,
  connectReceivingWallet,
  swapWallets as swapWalletsAction,
} from 'store/wallet';

import config from 'config';

export * from './types';

import { Dispatch } from 'redux';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
  Network,
  Chain,
  UnsignedTransaction,
  nativeChainIds,
  Platform,
  chainToPlatform,
} from '@wormhole-foundation/sdk';

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

export const walletAcceptedChains = (
  platform: Platform | undefined,
): Chain[] => {
  if (!platform) {
    return config.chainsArr.map((c) => c.sdkName);
  }
  return config.chainsArr
    .filter((c) => chainToPlatform(c.sdkName) === platform)
    .map((c) => c.sdkName);
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
  // Check if external wallet manager is configured
  if (config.externalWalletManager) {
    // TODO: should we switch chains in here?
    // TODO: why aren't we setting the wallet connection here?
    // will not setting the wallet connection cause issues elsewhere?
    try {
      const connected = await config.externalWalletManager.requestConnection(
        type as WalletType,
        chain,
      );

      if (connected) {
        const walletState = await config.externalWalletManager.getWalletState(
          type as WalletType,
        );

        // Update Redux state with external wallet data
        const payload = {
          address: walletState.address || '',
          type: chainToPlatform(chain),
          icon: walletState.walletIcon || '',
          name: walletState.walletName || 'External Wallet',
        };

        if (type === TransferWallet.SENDING) {
          dispatch(connectSourceWallet(payload));
        } else {
          dispatch(connectReceivingWallet(payload));
        }

        config.triggerEvent({
          type: 'wallet.connect',
          details: {
            side: type,
            chain: chain,
            wallet: walletState.walletName?.toLowerCase() || 'external',
          },
        });
      }

      return connected;
    } catch (e: any) {
      console.error('External wallet connection failed:', e);
      // TODO: is this an error if the user rejected the connection?
      throw e;
    }
  }

  // Original internal wallet logic
  const { wallet, name } = walletInfo;

  setWalletConnection(type, wallet);

  const chainConfig = config.chains[chain];
  if (!chainConfig) {
    throw new Error(`Unable to find wallets for chain ${chain}`);
  }

  const platform = chainToPlatform(chain);
  const _chainId = nativeChainIds.networkChainToNativeChainId.get(
    config.network,
    chain,
  );

  try {
    const chainId = typeof _chainId === 'bigint' ? Number(_chainId) : _chainId;
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
    localStorage.removeItem(config.cacheKey(`wallet:${platform}`));
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
    localStorage.setItem(config.cacheKey(`wallet:${platform}`), name);
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
  // Skip auto-connection if external wallet manager is configured
  // TODO: should the integrator handle this?
  if (config.externalWalletManager) {
    return;
  }

  const chainConfig = config.chains[chain!]!;
  const localStorageKey = config.cacheKey(
    `wallet:${chainToPlatform(chainConfig.sdkName)}`,
  );
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
          `Failed to autoconnect to wallet ${lastUsedWallet} for ${chain}: ${e.message}`,
        );
      }
    }
  }
};

export const useConnectToLastUsedWallet = (
  sourceChain?: Chain,
  destChain?: Chain,
): { isConnecting: boolean } => {
  const dispatch = useDispatch();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Early return if we don't have chains yet
    if (!sourceChain && !destChain) {
      return;
    }

    let canceled = false;

    const connect = async () => {
      try {
        if (sourceChain && !canceled)
          await connectLastUsedWallet(
            TransferWallet.SENDING,
            sourceChain,
            dispatch,
          );
        if (destChain && !canceled)
          await connectLastUsedWallet(
            TransferWallet.RECEIVING,
            destChain,
            dispatch,
          );
      } finally {
        setIsConnecting(false);
      }
    };

    setIsConnecting(true);
    connect();

    return () => {
      canceled = true;
    };
  }, [sourceChain, destChain, dispatch]);

  return { isConnecting };
};

export const getWalletConnection = (type: TransferWallet) => {
  return walletConnection[type];
};

// Helper function to check if wallet is connected (works with both internal and external wallets)
export const isWalletConnected = async (
  type: TransferWallet,
): Promise<boolean> => {
  if (config.externalWalletManager) {
    try {
      const walletState = await config.externalWalletManager.getWalletState(
        type as WalletType,
      );
      return walletState.isConnected;
    } catch (e) {
      console.error('Failed to check external wallet state:', e);
      return false;
    }
  }

  const wallet = walletConnection[type];
  return wallet !== undefined;
};

// Helper function to get wallet address (works with both internal and external wallets)
export const getWalletAddress = async (
  type: TransferWallet,
): Promise<string | undefined> => {
  if (config.externalWalletManager) {
    try {
      const walletState = await config.externalWalletManager.getWalletState(
        type as WalletType,
      );
      return walletState.address;
    } catch (e) {
      console.error('Failed to get external wallet address:', e);
      return undefined;
    }
  }

  const wallet = walletConnection[type];
  return wallet?.getAddress();
};

export const swapWalletConnections = async () => {
  // If external wallet manager is configured, use its swap method
  if (config.externalWalletManager?.swapWallets) {
    try {
      await config.externalWalletManager.swapWallets();
      return;
    } catch (e: any) {
      console.error('External wallet swap failed:', e);
      throw e;
    }
  }

  // Original internal wallet logic
  const temp = walletConnection.sending;
  walletConnection.sending = walletConnection.receiving;
  walletConnection.receiving = temp;
};

// Helper function to handle the complete wallet swap operation
export const swapWallets = async (dispatch: any) => {
  try {
    // Handle external wallet swapping first (if applicable)
    await swapWalletConnections();

    // Then update Redux state
    dispatch(swapWalletsAction());
  } catch (e: any) {
    console.error('Wallet swap failed:', e);
    throw e;
  }
};

export const disconnect = async (type: TransferWallet) => {
  // Check if external wallet manager is configured
  if (config.externalWalletManager) {
    try {
      await config.externalWalletManager.requestDisconnection(
        type as WalletType,
      );
      return;
    } catch (e: any) {
      console.error('External wallet disconnection failed:', e);
      throw e;
    }
  }

  // Original internal wallet logic
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
  // Check if external wallet manager is configured
  // TODO: there are additional checks done in the evm/solana/sui/aptos signAndSendTransaction functions
  // below. should externalWalletManager have a signTransaction method that can be used for solana and evm specifically
  // which have more checks in the functions below after the transaction is signed?
  if (config.externalWalletManager) {
    try {
      const transactionRequest: TransactionRequest = {
        chain,
        transaction: request,
        walletType: walletType as WalletType,
      };

      return await config.externalWalletManager.signAndSendTransaction(
        transactionRequest,
      );
    } catch (e: any) {
      console.error('External wallet transaction failed:', e);
      throw e;
    }
  }

  // Original internal wallet logic
  const chainConfig = config.chains[chain]!;

  const wallet = walletConnection[walletType];
  if (!wallet) {
    throw new Error('wallet is undefined');
  }

  const platform = chainToPlatform(chainConfig.sdkName);

  if (platform === 'Evm') {
    const evm = await import('utils/wallet/evm');
    const tx = await evm.signAndSendTransaction(
      request as EvmUnsignedTransaction<Network, EvmChains>,
      wallet,
      chain,
    );
    return tx;
  } else if (platform === 'Solana') {
    const solana = await import('utils/wallet/solana');
    const signature = await solana.signAndSendTransaction(
      request as SolanaUnsignedTransaction<Network>,
      wallet,
      options,
    );
    return signature;
  } else if (platform === 'Sui') {
    const sui = await import('utils/wallet/sui');
    const tx = await sui.signAndSendTransaction(
      request as SuiUnsignedTransaction<Network, SuiChains>,
      wallet,
    );
    return tx.id;
  } else if (platform === 'Aptos') {
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
  type: Platform;
  icon: string;
  isReady: boolean;
  wallet: Wallet;
};

const mapWallets = (
  wallets: Record<string, Wallet>,
  type: Platform,
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

// Utility to detect if Nightly is the active injected provider
function isNightlyInjectedProvider() {
  return (
    typeof window !== 'undefined' &&
    window.ethereum &&
    window.ethereum.isNightly === true
  );
}

export const getWalletOptions = async (
  chain: ChainConfig | undefined,
): Promise<WalletData[]> => {
  if (chain === undefined) {
    return [];
  }

  // If external wallet manager is configured, hide internal wallet options
  if (config.externalWalletManager) {
    return [];
  }

  const platform = chainToPlatform(chain.sdkName);
  if (platform === 'Evm') {
    const evm = await import('utils/wallet/evm');
    let wallets = Object.values(mapWallets(evm.getWallets(), platform));
    // Filter out 'Injected Wallet' if Nightly is the active injected provider
    if (isNightlyInjectedProvider()) {
      wallets = wallets.filter((w) => w.name !== 'Injected Wallet');
    }
    return wallets;
  } else if (platform === 'Solana') {
    const solana = await import('utils/wallet/solana');
    const solanaWallets = solana.fetchOptions(chain.sdkName);
    return Object.values(mapWallets(solanaWallets, platform));
  } else if (platform === 'Sui') {
    const suiWallet = await import('utils/wallet/sui');
    const suiOptions = await suiWallet.fetchOptions();
    return Object.values(mapWallets(suiOptions, platform));
  } else if (platform === 'Aptos') {
    const aptosWallet = await import('utils/wallet/aptos');
    const aptosOptions = await aptosWallet.fetchOptions();
    return Object.values(mapWallets(aptosOptions, platform));
  }
  return [];
};

// Extend the Window interface to include the 'ethereum' property
declare global {
  interface Window {
    ethereum?: any;
  }
}
