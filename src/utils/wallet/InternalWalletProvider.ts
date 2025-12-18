import type { Chain, Network } from '@wormhole-foundation/sdk-base';
import { chainToPlatform, nativeChainIds } from '@wormhole-foundation/sdk-base';
import { TransferWallet } from '.';
import { getWalletOptions, signAndSendTransaction } from '.';
import type {
  WormholeConnectWalletProvider,
  WalletProviderEvents,
} from './types';
import { type Wallet } from '@wormhole-labs/wallet-aggregator-core';
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
    chain: Chain;
    wallet: Wallet;
  };
  receiving?: {
    chain: Chain;
    wallet: Wallet;
  };
} = {};

function setWalletInLocalStorage(
  chain: Chain,
  type: TransferWallet,
  wallet: Wallet,
  overwrite: boolean,
) {
  const localStorageKey = getLastUsedWalletKey(chain, type);
  const walletName = wallet.getName();

  const existing =
    overwrite || !localStorageKey
      ? undefined
      : !!localStorage.getItem(localStorageKey);

  if (!existing && localStorageKey && walletName !== ReadOnlyWallet.NAME) {
    localStorage.setItem(localStorageKey, walletName);
  }
}

function removeWalletfromLocalStorage(chain: Chain, type: TransferWallet) {
  const localStorageKeyForType = getLastUsedWalletKey(chain, type);

  if (localStorageKeyForType) {
    localStorage.removeItem(localStorageKeyForType);
  }
}

function setWalletConnection(
  chain: Chain,
  type: TransferWallet,
  wallet: Wallet,
): void {
  walletConnections[type] = { chain, wallet };
  setWalletInLocalStorage(chain, type, wallet, true);

  const otherType =
    type === TransferWallet.RECEIVING
      ? TransferWallet.SENDING
      : TransferWallet.RECEIVING;

  setWalletInLocalStorage(chain, otherType, wallet, false);
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

function getLastUsedWalletKey(
  chain: Chain,
  type: TransferWallet,
): string | null {
  const chainConfig = config.chains[chain];
  if (!chainConfig) return null;

  const platform = chainToPlatform(chainConfig.sdkName);
  return config.cacheKey(`wallet:${platform}:${type}`);
}

async function connectLastUsedWallet(
  chain: Chain,
  type: TransferWallet,
): Promise<Wallet | null> {
  const localStorageKey = getLastUsedWalletKey(chain, type);
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
      removeWalletfromLocalStorage(chain, type);
      return null;
    }

    await connectWalletToChain(walletOption.wallet, chain);
    setWalletConnection(chain, type, walletOption.wallet);

    return walletOption.wallet;
  } catch {
    removeWalletfromLocalStorage(chain, type);
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

function disconnectWallet(chain: Chain, type: TransferWallet) {
  const connection = walletConnections[type];

  if (!connection || connection.chain !== chain) {
    return;
  }

  walletConnections[type] = undefined;
  removeWalletfromLocalStorage(chain, type);

  const otherType =
    type === TransferWallet.RECEIVING
      ? TransferWallet.SENDING
      : TransferWallet.RECEIVING;

  removeWalletfromLocalStorage(chain, otherType);

  try {
    void connection.wallet.disconnect();
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

function getWallet(chain: Chain, type: TransferWallet): Wallet | null {
  const connection = walletConnections[type];

  if (!connection) {
    return null;
  }

  if (connection.chain !== chain) {
    return null;
  }

  return connection.wallet;
}

async function signAndSendTransactionInternal(
  chain: Chain,
  wallet: Wallet,
  transaction: UnsignedTransaction<Network, Chain>,
): Promise<string> {
  return await signAndSendTransaction(chain, transaction, wallet);
}

function swapWallets(): void {
  let sending = walletConnections.sending;
  let receiving = walletConnections.receiving;

  if (receiving?.wallet.getName() === ReadOnlyWallet.NAME) {
    receiving.wallet.disconnect();
  }

  const temp = walletConnections.sending;
  walletConnections.sending = walletConnections.receiving;
  walletConnections.receiving = temp;

  sending = walletConnections.sending;
  receiving = walletConnections.receiving;

  if (sending) {
    setWalletInLocalStorage(
      sending?.chain,
      TransferWallet.SENDING,
      sending?.wallet,
      true,
    );
  }

  if (receiving) {
    setWalletInLocalStorage(
      receiving?.chain,
      TransferWallet.RECEIVING,
      receiving?.wallet,
      true,
    );
  }
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

function clearWallets() {
  walletConnections.sending = undefined;
  walletConnections.receiving = undefined;
}

export const internalWalletProvider = {
  isInternal: true as const,
  connectWallet,
  disconnectWallet,
  clearWallets,
  getWallet,
  signAndSendTransaction: signAndSendTransactionInternal,
  swapWallets,
  on,
  off,
  onWalletSelected,
  onWalletSelectCancelled,
} satisfies WormholeConnectWalletProvider & {
  isInternal: true;
  clearWallets: () => void;
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
