import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  CosmosTransaction,
  CosmosWallet,
  getWallets,
} from '@xlabs-libs/wallet-aggregator-cosmos';
import {
  CosmosEvmWallet,
  getWallets as getEvmWallets,
} from '@xlabs-libs/wallet-aggregator-cosmos-evm';
import { REST, RPCS, CHAINS } from 'config';

import {
  ChainName,
  Context,
  SendResult,
  ChainResourceMap,
} from '@wormhole-foundation/wormhole-connect-sdk';

const getCosmosWalletsEndpointsMap = () => {
  const prepareMap = (map: ChainResourceMap) =>
    Object.keys(map).reduce((acc, k) => {
      const conf = CHAINS[k as ChainName];
      if (conf?.chainId && conf?.context === Context.COSMOS) {
        acc[conf.chainId] = map[k as ChainName]!;
      }
      return acc;
    }, {} as Record<string, string>);

  const rpcs = prepareMap(RPCS);
  const rests = prepareMap(REST);

  return { rpcs, rests };
};

const buildCosmosEvmWallets = () => {
  const { rests, rpcs } = getCosmosWalletsEndpointsMap();
  const wallets: CosmosEvmWallet[] = getEvmWallets(rpcs, rests);

  return wallets.reduce((acc, w: CosmosEvmWallet) => {
    acc[w.getName()] = w;
    return acc;
  }, {} as Record<string, Wallet>);
};

const buildCosmosWallets = () => {
  const { rests, rpcs } = getCosmosWalletsEndpointsMap();
  const wallets: CosmosWallet[] = getWallets(rpcs, rests);

  return wallets.reduce((acc, w: CosmosWallet) => {
    acc[w.getName()] = w;
    return acc;
  }, {} as Record<string, Wallet>);
};

export const wallets = {
  cosmos: buildCosmosWallets(),
  cosmosEvm: buildCosmosEvmWallets(),
};

export async function signAndSendTransaction(
  transaction: SendResult,
  wallet: Wallet | undefined,
) {
  const cosmosWallet = wallet as CosmosWallet;
  const result = await cosmosWallet.signAndSendTransaction(
    transaction as CosmosTransaction,
  );

  if (result.data?.code) {
    throw new Error(
      `Cosmos transaction failed with code ${result.data.code}. Log: ${result.data.rawLog}`,
    );
  }

  return result;
}

export async function switchChain(w: Wallet, chainId: number | string) {
  await (w as CosmosWallet).switchChain(chainId as string);
}
