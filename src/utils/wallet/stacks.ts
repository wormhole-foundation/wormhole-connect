import type { Wallet } from '@wormhole-labs/wallet-aggregator-core';
import { getSupportedWallets } from '@wormhole-labs/wallet-aggregator-stacks';

import type { Network, UnsignedTransaction } from '@wormhole-foundation/sdk';
import type { StacksChains } from '@wormhole-foundation/sdk-stacks';

import config from 'config';

export function fetchOptions(): Record<string, Wallet> {
  const stacksWallets = getSupportedWallets({
    network: config.isMainnet ? 'mainnet' : 'testnet',
  });

  return stacksWallets.reduce((obj: Record<string, Wallet>, wallet) => {
    obj[wallet.getName().toLowerCase().replace(/\s+/g, '_')] = wallet as Wallet;
    return obj;
  }, {});
}

export async function signAndSendTransaction(
  request: UnsignedTransaction<Network, StacksChains>,
  wallet: Wallet,
) {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const transaction = request.transaction;

  // The transaction should already be in ContractCallPayload format
  const tx = await wallet.signAndSendTransaction(transaction);
  return tx;
}
