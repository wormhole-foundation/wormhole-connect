import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWallet,
  Eip6963Wallet,
  Eip6963Wallets,
  WalletConnectWallet,
} from '@xlabs-libs/wallet-aggregator-evm';

import {
  EvmUnsignedTransaction,
  EvmChains,
} from '@wormhole-foundation/sdk-evm';
import { Network } from '@wormhole-foundation/sdk';

import config from 'config';

const eip6963Wallets = Object.entries(Eip6963Wallets).reduce(
  (acc, [key, name]) => ({ [key]: new Eip6963Wallet(name), ...acc }),
  {},
);

export const wallets = {
  ...eip6963Wallets,
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
  request: EvmUnsignedTransaction<Network, EvmChains>,
  w: Wallet,
  chainName: string,
  options: any, // TODO ?!?!!?!?
): Promise<string> {
  // TODO remove reliance on SDkv1 here (multi-provider)
  const signer = config.wh.getSigner(chainName);
  if (!signer) throw new Error('No signer found for chain' + chainName);

  const tx = await signer.sendTransaction(request.transaction);
  const result = await tx.wait();

  // TODO move all this to ethers 6
  /* @ts-ignore */
  return result.hash;
}
