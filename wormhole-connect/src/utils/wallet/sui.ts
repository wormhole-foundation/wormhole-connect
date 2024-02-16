import { TransactionBlock } from '@mysten/sui.js';
import { SendResult } from '@wormhole-foundation/wormhole-connect-sdk';
import { SuiWallet, getWallets } from '@xlabs-libs/wallet-aggregator-sui';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';

export async function fetchOptions() {
  const suiWallets = await getWallets({ timeout: 0 });
  return suiWallets.reduce((obj: { [key: string]: SuiWallet }, value) => {
    obj[value.getName()] = value;
    return obj;
  }, {});
}

export const signAndSendTransaction = async (
  transaction: SendResult,
  wallet: Wallet,
) => {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  return await wallet.signAndSendTransaction({
    transactionBlock: transaction as TransactionBlock,
  });
};
