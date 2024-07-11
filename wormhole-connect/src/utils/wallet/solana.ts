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

import config from 'config';

import {
  createPriorityFeeInstructions,
  isVersionedTransaction,
  SolanaUnsignedTransaction,
} from '@wormhole-foundation/sdk-solana';
import { Network } from '@wormhole-foundation/sdk';
import { TransactionMessage } from '@solana/web3.js';

const getWalletName = (wallet: Wallet) =>
  wallet.getName().toLowerCase().replaceAll('wallet', '').trim();

export function fetchOptions() {
  const tag = config.isMainnet ? 'mainnet-beta' : 'devnet';
  const connection = new Connection(config.rpcs.solana || clusterApiUrl(tag));

  return {
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
    ...(config.walletConnectProjectId
      ? {
          walletConnect: new SolanaWallet(
            new WalletConnectWalletAdapter({
              network: config.isMainnet
                ? SolanaNetwork.Mainnet
                : SolanaNetwork.Devnet,
              options: {
                projectId: config.walletConnectProjectId,
              },
            }),
            connection,
          ),
        }
      : {}),
  };
}

export async function signAndSendTransaction(
  request: SolanaUnsignedTransaction<Network>,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
) {
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const tx = request.transaction.transaction;
  if (config.rpcs.solana) {
    const conn = new Connection(config.rpcs.solana);
    if (isVersionedTransaction(tx)) {
      const msg = TransactionMessage.decompile(tx.message);
      const { blockhash } = await conn.getLatestBlockhash();
      msg.recentBlockhash = blockhash;
      const computeBudgetIx = await createPriorityFeeInstructions(
        conn,
        tx,
        0.75,
      );
      msg.instructions.push(...computeBudgetIx);
      tx.message = msg.compileToV0Message();
      tx.sign(request.transaction.signers ?? []);
    } else {
      const { blockhash, lastValidBlockHeight } =
        await conn.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      const computeBudgetIx = await createPriorityFeeInstructions(
        conn,
        tx,
        0.75,
      );
      tx.add(...computeBudgetIx);
      if (request.transaction.signers) {
        tx.partialSign(...request.transaction.signers);
      }
    }
  } else {
    throw new Error('Need Solana RPC');
  }

  return await (wallet as SolanaWallet).signAndSendTransaction({
    // TODO: VersionedTransaction is supported, but the interface needs to be updated
    transaction: tx as Transaction,
    options,
  });
}
