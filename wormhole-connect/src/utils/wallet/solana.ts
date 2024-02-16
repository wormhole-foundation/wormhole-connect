import { SendResult } from '@wormhole-foundation/wormhole-connect-sdk';
import { WalletAdapterNetwork as SolanaNetwork } from '@solana/wallet-adapter-base';

import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  BitgetWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SolongWalletAdapter,
  TorusWalletAdapter,
  NightlyWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import {
  clusterApiUrl,
  ConfirmOptions,
  Connection,
  Transaction,
} from '@solana/web3.js';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@xlabs-libs/wallet-aggregator-solana';

import { ENV, RPCS, WALLET_CONNECT_PROJECT_ID, isMainnet } from 'config';

const tag = ENV === 'MAINNET' ? 'mainnet-beta' : 'devnet';
const connection = new Connection(RPCS.solana || clusterApiUrl(tag));

const getWalletName = (wallet: Wallet) =>
  wallet.getName().toLowerCase().replaceAll('wallet', '').trim();

const solanaWallets = {
  ...getSolanaStandardWallets(connection).reduce((acc, w) => {
    acc[getWalletName(w)] = w;
    return acc;
  }, {} as Record<string, Wallet>),
  bitget: new SolanaWallet(new BitgetWalletAdapter(), connection),
  clover: new SolanaWallet(new CloverWalletAdapter(), connection),
  coin98: new SolanaWallet(new Coin98WalletAdapter(), connection),
  solong: new SolanaWallet(new SolongWalletAdapter(), connection),
  torus: new SolanaWallet(new TorusWalletAdapter(), connection),
  nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
  ...(WALLET_CONNECT_PROJECT_ID
    ? {
        walletConnect: new SolanaWallet(
          new WalletConnectWalletAdapter({
            network: isMainnet ? SolanaNetwork.Mainnet : SolanaNetwork.Devnet,
            options: {
              projectId: WALLET_CONNECT_PROJECT_ID,
            },
          }),
          connection,
        ),
      }
    : {}),
};

export function fetchOptions() {
  return solanaWallets;
}

export async function signAndSendTransaction(
  transaction: SendResult,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
) {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  return await (wallet as SolanaWallet).signAndSendTransaction({
    transaction: transaction as Transaction,
    options,
  });
}
