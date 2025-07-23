import type { ChainConfig } from 'config/types';
import type { Wallet } from '@wormhole-labs/wallet-aggregator-core';
import { WalletState } from '@wormhole-labs/wallet-aggregator-core';

import config from 'config';

export * from './types';
export type { WormholeConnectWalletProvider } from './types';

import type {
  Network,
  Chain,
  UnsignedTransaction,
  Platform,
} from '@wormhole-foundation/sdk';
import { chainToPlatform } from '@wormhole-foundation/sdk';

import type {
  EvmUnsignedTransaction,
  EvmChains,
} from '@wormhole-foundation/sdk-evm';
import type {
  SuiUnsignedTransaction,
  SuiChains,
} from '@wormhole-foundation/sdk-sui';
import type {
  AptosUnsignedTransaction,
  AptosChains,
} from '@wormhole-foundation/sdk-aptos';
import type { SolanaUnsignedTransaction } from '@wormhole-foundation/sdk-solana';

export enum TransferWallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

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

export const signAndSendTransaction = async (
  chain: Chain,
  request: UnsignedTransaction<Network, Chain>,
  wallet: Wallet,
  options: any = {},
): Promise<string> => {
  const chainConfig = config.chains[chain]!;

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
