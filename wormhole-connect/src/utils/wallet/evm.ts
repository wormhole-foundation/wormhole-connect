import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  BinanceWallet,
  EVMWallet,
  Eip6963Wallet,
  Eip6963Wallets,
  InjectedWallet,
  InjectedWallets,
  WalletConnectWallet,
} from '@xlabs-libs/wallet-aggregator-evm';

import {
  EvmUnsignedTransaction,
  EvmChains,
} from '@wormhole-foundation/sdk-evm';
import { Network } from '@wormhole-foundation/sdk';

import config from 'config';
import { getBigInt } from 'ethers';

const eip6963Wallets = Object.entries(Eip6963Wallets).reduce(
  (acc, [key, name]) => ({ [key]: new Eip6963Wallet(name), ...acc }),
  {},
);

export const wallets = {
  ...eip6963Wallets,
  okxwallet: new Eip6963Wallet({
    name: InjectedWallets.OKXWallet,
    url: 'https://www.okx.com/web3',
    icon: 'data:image/png;base64,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',
  }),
  injected: new InjectedWallet(),
  binance: new BinanceWallet({ options: {} }),
  ...(config.ui.walletConnectProjectId
    ? {
        walletConnect: new WalletConnectWallet({
          connectorOptions: {
            projectId: config.ui.walletConnectProjectId,
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
  const signer = config.whLegacy.getSigner(chainName);
  if (!signer) throw new Error('No signer found for chain' + chainName);

  // Ensure the signer is connected to the correct chain
  const provider = await signer.provider?.getNetwork();
  const expectedChainId = request.transaction.chainId
    ? getBigInt(request.transaction.chainId)
    : undefined;
  const actualChainId = provider?.chainId;

  if (!actualChainId || !expectedChainId || actualChainId !== expectedChainId) {
    throw new Error(
      `Signer is not connected to the right chain. Expected ${expectedChainId}, got ${actualChainId}`,
    );
  }

  const tx = await signer.sendTransaction(request.transaction);
  const result = await tx.wait();

  // TODO move all this to ethers 6
  /* @ts-ignore */
  return result.hash;
}
