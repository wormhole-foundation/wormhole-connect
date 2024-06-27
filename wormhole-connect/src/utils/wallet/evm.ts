import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWallet,
  InjectedWallet,
  WalletConnectWallet,
} from '@kev1n-peters/wallet-aggregator-evm';
import config from 'config';

export const wallets = {
  injected: new InjectedWallet(),
  ...(config.walletConnectProjectId
    ? {
        walletConnect: new WalletConnectWallet({
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
