// This module is only to be included in other modules using import()
// so that it loads dynamically as a separate bundle
import { Network, CHAIN_ID_SEI } from '@certusone/wormhole-sdk';
import { ENV, RPCS } from 'config';
import { SendResult } from '@wormhole-foundation/wormhole-connect-sdk';
import {
  SeiChainId,
  SeiWallet,
  SeiTransaction,
  getSupportedWallets,
} from '@xlabs-libs/wallet-aggregator-sei';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';

export const getSeiChainId = (env: Network) =>
  env === 'MAINNET' ? 'pacific-1' : 'atlantic-2';

export async function fetchOptions() {
  const seiWallets = getSupportedWallets({
    chainId: getSeiChainId(ENV) as SeiChainId,
    rpcUrl: RPCS.sei || '',
  });

  return seiWallets.reduce((obj: { [key: string]: SeiWallet }, value) => {
    obj[value.getName()] = value;
    return obj;
  }, {});
}

export async function signAndSendTransaction(
  transaction: SendResult,
  wallet: Wallet,
) {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const seiWallet = wallet as SeiWallet;
  const result = await seiWallet.signAndSendTransaction(
    transaction as SeiTransaction,
  );

  if (result.data?.code) {
    throw new Error(
      `Sei transaction failed with code ${result.data.code}. Log: ${result.data.rawLog}`,
    );
  }

  return result;
}

// TODO is this used anywhere?
export const simulateSeiTransaction = async (
  transaction: SeiTransaction,
  wallet: SeiWallet,
) => {
  if (wallet?.getChainId() !== CHAIN_ID_SEI)
    throw new Error('Wallet is not for Sei chain');
  return wallet.calculateFee(transaction);
};
