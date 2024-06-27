// This module is only to be included in other modules using import()
// so that it loads dynamically as a separate bundle
import { Network } from 'config/types';
import config from 'config';
import { SendResult } from 'sdklegacy';
import {
  SeiChainId,
  SeiWallet,
  SeiTransaction,
  getSupportedWallets,
} from '@xlabs-libs/wallet-aggregator-sei';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';

export const getSeiChainId = (env: Network) =>
  env === 'mainnet' ? 'pacific-1' : 'atlantic-2';

export async function fetchOptions() {
  const seiWallets = getSupportedWallets({
    chainId: getSeiChainId(config.network) as SeiChainId,
    rpcUrl: config.rpcs.sei || '',
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
