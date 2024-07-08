import { TransactionBlock } from '@mysten/sui.js';
import { SuiWallet, getWallets } from '@xlabs-libs/wallet-aggregator-sui';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';

import { Network } from '@wormhole-foundation/sdk';
import {
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
    transactionBlock: request.transaction as TransactionBlock,
  });
};
