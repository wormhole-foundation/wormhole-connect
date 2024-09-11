import { type ChainResourceMap } from '@wormhole-foundation/wormhole-connect-sdk';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWallet,
  InjectedWallet,
  BinanceWallet,
  WalletConnectWallet,
  DEFAULT_CHAINS,
} from '@xlabs-libs/wallet-aggregator-evm';
import config from 'config';

const isChainResourceKey = (key: string): key is keyof ChainResourceMap =>
  Object.keys(config.rpcs).includes(key);

const CHAINS_CONFIG = Object.entries(DEFAULT_CHAINS).map(
  ([wagmiChainName, wagmiConfig]) => {
    if (isChainResourceKey(wagmiChainName)) {
      const rpc = config.rpcs[wagmiChainName];
      if (rpc) {
        return {
          ...wagmiConfig,
          rpcUrls: {
            ...wagmiConfig.rpcUrls,
            [wagmiChainName]: {
              http: [rpc],
            },
            default: {
              http: [rpc],
            },
            public: {
              http: [rpc],
            },
          },
        };
      }
    }
    return wagmiConfig;
  },
);

export const wallets = {
  injected: new InjectedWallet({
    chains: CHAINS_CONFIG,
  }),
  binance: new BinanceWallet({
    options: {},
  }),
  ...(config.walletConnectProjectId
    ? {
        walletConnect: new WalletConnectWallet({
          chains: CHAINS_CONFIG,
          connectorOptions: {
            projectId: config.walletConnectProjectId,
          },
        }),
      }
    : {}),
};

export interface AssetInfo {
  address: string;
  symbol: string;
  decimals: number;
  chainId?: number;
}

export const watchAsset = async (asset: AssetInfo, wallet: Wallet) => {
  const w = wallet as EVMWallet;
  // check in case the actual type is not EVMWallet
  if (!w || !w.watchAsset) return;
  await w.watchAsset({
    type: 'ERC20',
    options: asset,
  });
};

export async function switchChain(w: Wallet, chainId: number | string) {
  await (w as EVMWallet).switchChain(chainId as number);
}
