import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import { CosmosWallet, getWallets } from '@xlabs-libs/wallet-aggregator-cosmos';
import {
  CosmosEvmWallet,
  getWallets as getEvmWallets,
} from '@xlabs-libs/wallet-aggregator-cosmos-evm';
import config from 'config';

import { ChainName, Context, ChainResourceMap } from 'sdklegacy';
import { Network } from '@wormhole-foundation/sdk';
import {
  CosmwasmUnsignedTransaction,
  CosmwasmChains,
} from '@wormhole-foundation/sdk-cosmwasm';

const getCosmosWalletsEndpointsMap = () => {
  const prepareMap = (map: ChainResourceMap) =>
    Object.keys(map).reduce(
      (acc, k) => {
        const conf = config.chains[k as ChainName];
        if (conf?.chainId && conf?.context === Context.COSMOS) {
          acc[conf.chainId] = map[k as ChainName]!;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

  const rpcs = prepareMap(config.rpcs);
  const rests = prepareMap(config.rest);

  return { rpcs, rests };
};

const buildCosmosEvmWallets = () => {
  const { rests, rpcs } = getCosmosWalletsEndpointsMap();
  const wallets: CosmosEvmWallet[] = getEvmWallets(rpcs, rests);

  return wallets.reduce(
    (acc, w: CosmosEvmWallet) => {
      acc[w.getName()] = w;
      return acc;
    },
    {} as Record<string, Wallet>,
  );
};

const buildCosmosWallets = () => {
  const { rests, rpcs } = getCosmosWalletsEndpointsMap();
  const wallets: CosmosWallet[] = getWallets(rpcs, rests);

  return wallets.reduce(
    (acc, w: CosmosWallet) => {
      acc[w.getName()] = w;
      return acc;
    },
    {} as Record<string, Wallet>,
  );
};

export const wallets = {
  cosmos: buildCosmosWallets(),
  cosmosEvm: buildCosmosEvmWallets(),
};

export async function signAndSendTransaction(
  request: CosmwasmUnsignedTransaction<Network, CosmwasmChains>,
  wallet: Wallet | undefined,
) {
  const cosmosWallet = wallet as CosmosWallet;
  const result = await cosmosWallet.signAndSendTransaction(request.transaction);

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
