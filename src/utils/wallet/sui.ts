import type { Transaction } from '@mysten/sui/transactions';
import type { SuiWallet } from '@wormhole-labs/wallet-aggregator-sui';
import { getWallets } from '@wormhole-labs/wallet-aggregator-sui';
import type { Wallet } from '@wormhole-labs/wallet-aggregator-core';

import type { Network } from '@wormhole-foundation/sdk';
import type {
  SuiUnsignedTransaction,
  SuiChains,
} from '@wormhole-foundation/sdk-sui';

export async function fetchOptions() {
  const suiWallets = await getWallets({ timeout: 0 });
  return suiWallets.reduce((obj: { [key: string]: SuiWallet }, value) => {
    obj[value.getName()] = value;
    return obj;
  }, {});
}

export const signAndSendTransaction = async (
  request: SuiUnsignedTransaction<Network, SuiChains>,
  wallet: Wallet,
) => {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  return await wallet.signAndSendTransaction({
    transactionBlock: request.transaction as Transaction,
  });
};
