import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import type { Network as AptosNetwork } from '@aptos-labs/wallet-adapter-core';
import { AptosWallet } from '@xlabs-libs/wallet-aggregator-aptos';
import { Aptos } from '@aptos-labs/ts-sdk';

import { Network } from '@wormhole-foundation/sdk';
import {
  AptosUnsignedTransaction,
  AptosChains,
} from '@wormhole-foundation/sdk-aptos';

import config, { getWormholeContextV2 } from 'config';

export function fetchOptions() {
  const aptosWalletConfig = {
    network: config.isMainnet
      ? ('mainnet' as AptosNetwork)
      : ('testnet' as AptosNetwork),
  };
  const aptosWallets: Record<string, AptosWallet> = {};
  const walletCore = AptosWallet.walletCoreFactory(aptosWalletConfig, true, []);
  walletCore.wallets.forEach((wallet) => {
    aptosWallets[wallet.name] = new AptosWallet(wallet, walletCore);
  });
  return aptosWallets;
}

export async function signAndSendTransaction(
  request: AptosUnsignedTransaction<Network, AptosChains>,
  wallet: Wallet | undefined,
) {
  if (!wallet) throw new Error('No Aptos wallet provided');

  const payload = request.transaction;
  // The wallets do not handle Uint8Array serialization
  payload.functionArguments = payload.functionArguments.map((a: any) => {
    if (a instanceof Uint8Array) {
      return Array.from(a);
    } else if (typeof a === 'bigint') {
      return a.toString();
    } else {
      return a;
    }
  });

  const context = await getWormholeContextV2();
  const aptos = context.getPlatform('Aptos');
  const rpc = (await aptos.getRpc('Aptos')) as Aptos;

  const transaction = await rpc.transaction.build.simple({
    sender: wallet.getAddress()!,
    data: payload,
    options: {
      // this is set to 5 minutes in case the user takes a while to sign the transaction
      expireTimestamp: Math.floor(Date.now() / 1000) + 60 * 5,
    },
  });

  const authenticator = await (wallet as AptosWallet).signTransaction(
    transaction,
  );
  const submitted = await rpc.transaction.submit.simple({
    transaction,
    senderAuthenticator: authenticator,
  });

  await rpc.waitForTransaction({ transactionHash: submitted.hash });

  return submitted.hash;
}
