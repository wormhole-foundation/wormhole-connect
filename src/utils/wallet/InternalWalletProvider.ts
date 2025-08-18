import type { Chain, Network } from '@wormhole-foundation/sdk-base';
import { chainToPlatform, nativeChainIds } from '@wormhole-foundation/sdk-base';
import type { TransferWallet } from '.';
import { getWalletOptions, signAndSendTransaction } from '.';
import type {
  WormholeConnectWalletProvider,
  WalletProviderEvents,
} from './types';
import type { Wallet } from '@wormhole-labs/wallet-aggregator-core';
import config from 'config';
import type { UnsignedTransaction } from '@wormhole-foundation/sdk-definitions';
import { ReadOnlyWallet } from './ReadOnlyWallet';

/**
 * Built-in wallet provider that integrates with @wormhole-labs/wallet-aggregator-core
 * to fetch available wallets and coordinates with the wallet sidebar UI for selection.
 *
 * Flow: connectWallet() creates a promise → UI opens sidebar → user selects wallet →
 * onWalletSelected() connects the wallet and resolves the promise with the connected wallet.
 */

let pendingConnect:
  | {
      chain: Chain;
      type: TransferWallet;
      promise: Promise<Wallet>;
      resolve: (wallet: Wallet) => void;
      reject: (error: Error) => void;
    }
  | undefined;

const walletConnections: {
  sending?: {
    wallet: Wallet;
    disconnectHandler: () => void;
  };
  receiving?: {
    wallet: Wallet;
    disconnectHandler: () => void;
  };
} = {};

function setWalletConnection(
  chain: Chain,
  type: TransferWallet,
  wallet: Wallet,
): void {
  const previousConnection = walletConnections[type];
  if (previousConnection) {
    previousConnection.wallet.off(
      'disconnect',
      previousConnection.disconnectHandler,
    );
  }

  const localStorageKey = getLastUsedWalletKey(chain);

  const handleDisconnect = () => {
    walletConnections[type] = undefined;
    wallet.off('disconnect', handleDisconnect);
    if (localStorageKey) {
      localStorage.removeItem(localStorageKey);
    }
  };

  walletConnections[type] = {
    wallet,
    disconnectHandler: handleDisconnect,
  };

  wallet.on('disconnect', handleDisconnect);

  if (localStorageKey && wallet.getName() !== ReadOnlyWallet.NAME) {
    localStorage.setItem(localStorageKey, wallet.getName());
  }
}

function getWalletConnection(type: TransferWallet): Wallet | undefined {
  return walletConnections[type]?.wallet;
}

async function connectWalletToChain(
  wallet: Wallet,
  chain: Chain,
): Promise<void> {
  const _chainId = nativeChainIds.networkChainToNativeChainId.get(
    config.network,
    chain,
  );
  const chainId = typeof _chainId === 'bigint' ? Number(_chainId) : _chainId;
  if (chainId === undefined) {
    throw new Error(
      `Native chain ID not found for ${chain} on ${config.network}`,
    );
  }

  await wallet.connect({ chainId });

  const address = wallet.getAddress();
  if (!address) {
    throw new Error(
      `Wallet ${wallet.getName()} did not return an address for chain ${chain}`,
    );
  }
}

function getLastUsedWalletKey(chain: Chain): string | null {
  const chainConfig = config.chains[chain];
  if (!chainConfig) return null;

  const platform = chainToPlatform(chainConfig.sdkName);
  return config.cacheKey(`wallet:${platform}`);
}

async function connectLastUsedWallet(
  chain: Chain,
  type: TransferWallet,
): Promise<Wallet | null> {
  const localStorageKey = getLastUsedWalletKey(chain);
  if (!localStorageKey) return null;

  const lastUsedWallet = localStorage.getItem(localStorageKey);
  if (!lastUsedWallet || lastUsedWallet === 'WalletConnect') {
    return null;
  }

  try {
    const chainConfig = config.chains[chain]!;
    const options = await getWalletOptions(chainConfig);
    const walletOption = options.find((w) => w.name === lastUsedWallet);

    if (!walletOption?.isReady) {
      localStorage.removeItem(localStorageKey);
      return null;
    }

    await connectWalletToChain(walletOption.wallet, chain);
    setWalletConnection(chain, type, walletOption.wallet);

    return walletOption.wallet;
  } catch {
    localStorage.removeItem(localStorageKey);
    return null;
  }
}

async function connectWallet(
  chain: Chain,
  type: TransferWallet,
  autoConnect?: boolean,
): Promise<Wallet | null> {
  if (autoConnect) {
    return await connectLastUsedWallet(chain, type);
  }

  if (pendingConnect) {
    if (pendingConnect.chain !== chain || pendingConnect.type !== type) {
      return Promise.reject('Connect wallet pending for other chain/type');
    }

    return pendingConnect.promise;
  }

  let resolve: (wallet: Wallet) => void;
  let reject: (error: Error) => void;

  const promise = new Promise<Wallet>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  pendingConnect = {
    chain,
    type,
    promise,
    resolve: resolve!,
    reject: reject!,
  };

  return promise;
}

function getWallet(_chain: Chain, type: TransferWallet): Wallet | null {
  return getWalletConnection(type) || null;
}

async function signAndSendTransactionInternal(
  chain: Chain,
  wallet: Wallet,
  transaction: UnsignedTransaction<Network, Chain>,
): Promise<string> {
  return await signAndSendTransaction(chain, transaction, wallet);
}

function swapWallets(): void {
  if (walletConnections.receiving?.wallet.getName() === ReadOnlyWallet.NAME) {
    walletConnections.receiving.wallet.disconnect();
  }

  const temp = walletConnections.sending;
  walletConnections.sending = walletConnections.receiving;
  walletConnections.receiving = temp;
}

function on<T extends keyof WalletProviderEvents>(
  _event: T,
  _handler: WalletProviderEvents[T],
): void {
  // no-op for internal provider, as it doesn't emit events
}

function off<T extends keyof WalletProviderEvents>(
  _event: T,
  _handler: WalletProviderEvents[T],
): void {
  // no-op for internal provider, as it doesn't emit events
}

async function onWalletSelected(
  wallet: Wallet,
  chain: Chain,
  type: TransferWallet,
): Promise<void> {
  if (!pendingConnect) {
    throw new Error('No pending wallet connection request');
  }

  if (pendingConnect.chain !== chain || pendingConnect.type !== type) {
    throw new Error(
      `Wallet selection mismatch: expected ${pendingConnect.chain}/${pendingConnect.type}, ` +
        `but got ${chain}/${type}`,
    );
  }
  try {
    await connectWalletToChain(wallet, chain);

    setWalletConnection(chain, type, wallet);
    pendingConnect.resolve(wallet);
  } catch (error) {
    pendingConnect.reject(error as Error);
  } finally {
    pendingConnect = undefined;
  }
}

function onWalletSelectCancelled(): void {
  if (pendingConnect) {
    pendingConnect.reject(new Error('User cancelled wallet connection'));
    pendingConnect = undefined;
  }
}

export const internalWalletProvider = {
  isInternal: true as const,
  connectWallet,
  getWallet,
  signAndSendTransaction: signAndSendTransactionInternal,
  swapWallets,
  on,
  off,
  onWalletSelected,
  onWalletSelectCancelled,
} satisfies WormholeConnectWalletProvider & {
  isInternal: true;
  onWalletSelected: (
    wallet: Wallet,
    chain: Chain,
    type: TransferWallet,
  ) => Promise<void>;
  onWalletSelectCancelled: () => void;
};

export type InternalWalletProvider = typeof internalWalletProvider;

export function isInternalProvider(
  provider: WormholeConnectWalletProvider,
): provider is InternalWalletProvider {
  return Object.hasOwn(provider, 'isInternal');
}
