import type { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { SuiWallet } from '@wormhole-labs/wallet-aggregator-sui';
import { getWallets } from '@wormhole-labs/wallet-aggregator-sui';
import type { Wallet } from '@wormhole-labs/wallet-aggregator-core';

import type { Network } from '@wormhole-foundation/sdk';
import type {
  SuiUnsignedTransaction,
  SuiChains,
} from '@wormhole-foundation/sdk-sui';
import { getWormholeContextV2 } from 'config';

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

  const tx = await wallet.signAndSendTransaction({
    transactionBlock: request.transaction as Transaction,
  });

  // Wait for transaction confirmation and check for on-chain execution errors
  const context = await getWormholeContextV2();
  const sui = context.getPlatform('Sui');
  const rpc = sui.getRpc('Sui') as SuiClient;

  const result = await rpc.waitForTransaction({
    digest: tx.id,
    options: { showEffects: true },
  });

  if (result.effects?.status.status === 'failure') {
    const errorMessage = result.effects.status.error || 'Transaction failed';
    throw new Error(`Transaction failed on-chain: ${errorMessage}`);
  }

  return tx;
};
