import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWallet,
  InjectedWallet,
  WalletConnectWallet,
  Chain,
  DEFAULT_CHAINS,
} from '@xlabs-libs/wallet-aggregator-evm';
import config from 'config';

const buildChains = (): Chain[] => {
  const ethConfig = DEFAULT_CHAINS.find((c) => c.id === 1);
  return ethConfig
    ? [
        ...DEFAULT_CHAINS,
        {
          ...ethConfig,
          rpcUrls: {
            bsc: { http: [config.rpcs.bsc!] },
            ethereum: { http: [config.rpcs.ethereum!] },
            default: { http: [config.rpcs.ethereum!] },
            public: { http: [config.rpcs.ethereum!] },
          },
        },
      ]
    : DEFAULT_CHAINS;
};

export const wallets = {
  injected: new InjectedWallet({
    chains: buildChains(),
  }),
  ...(config.walletConnectProjectId
    ? {
        walletConnect: new WalletConnectWallet({
          chains: buildChains(),
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
