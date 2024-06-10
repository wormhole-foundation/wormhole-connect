import { SendResult } from '@wormhole-foundation/wormhole-connect-sdk';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWallet,
  InjectedWallet,
  WalletConnectWallet,
} from '@xlabs-libs/wallet-aggregator-evm';
import config from 'config';
import { Transaction } from 'ethers';

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

export async function signAndSendTransaction(
  transaction: SendResult,
  w: Wallet,
  chainName: string,
  options: any, // TODO ?!?!!?!?
) {
  // TODO remove reliance on SDkv1 here (multi-provider)
  const signer = config.wh.getSigner(chainName);
  if (!signer) throw new Error('No signer found for chain' + chainName);
  const v = await signer.sendTransaction(transaction as Transaction);
  return await v.wait();
}
