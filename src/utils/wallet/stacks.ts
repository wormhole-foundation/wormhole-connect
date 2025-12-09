import type { Wallet } from '@wormhole-labs/wallet-aggregator-core';
import { getSupportedWallets } from '@wormhole-labs/wallet-aggregator-stacks';

import type { Network, UnsignedTransaction } from '@wormhole-foundation/sdk';
import type { StacksChains } from '@wormhole-foundation/sdk-stacks';

import config from 'config';
import { fetchJson } from 'utils';

export function fetchOptions(): Record<string, Wallet> {
  const stacksWallets = getSupportedWallets({
    network: config.isMainnet ? 'mainnet' : 'testnet',
  });

  return stacksWallets.reduce((obj: Record<string, Wallet>, wallet) => {
    obj[wallet.getName()] = wallet as Wallet;
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

  await waitForConfirmation(tx.id, config.rpcs.Stacks!);

  return tx;
}

// TODO: move to SDK?
async function waitForConfirmation(txId: string, clientBaseUrl: string) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const txInfo = await fetchJson(`${clientBaseUrl}/extended/v1/tx/${txId}`);

    if (txInfo.tx_status === 'success') {
      return txInfo;
    }

    if (
      txInfo.tx_status === 'abort_by_response' ||
      txInfo.tx_status === 'abort_by_post_condition'
    ) {
      throw new Error(
        `Transaction ${txId} failed with status: ${txInfo.tx_status}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    attempts++;
  }

  throw new Error('Transaction confirmation timeout');
}
