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
  Commitment,
  ConfirmOptions,
  Connection,
  RpcResponseAndContext,
  SignatureResult,
  Transaction,
} from '@solana/web3.js';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@xlabs-libs/wallet-aggregator-solana';

import config from 'config';

import {
  isVersionedTransaction,
  SolanaUnsignedTransaction,
  determinePriorityFee,
} from '@wormhole-foundation/sdk-solana';
import { Network } from '@wormhole-foundation/sdk';
import { TransactionMessage } from '@solana/web3.js';
import { ComputeBudgetProgram } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { VersionedTransaction } from '@solana/web3.js';

const getWalletName = (wallet: Wallet) =>
  wallet.getName().toLowerCase().replaceAll('wallet', '').trim();

export function fetchOptions() {
  const tag = config.isMainnet ? 'mainnet-beta' : 'devnet';
  const connection = new Connection(config.rpcs.Solana || clusterApiUrl(tag));

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

// This function signs and sends the transaction while constantly checking for confirmation
// and resending the transaction if it hasn't been confirmed after the specified interval
// NOTE: The caller is responsible for simulating the transaction and setting any compute budget
// or priority fee before calling this function
// See https://docs.triton.one/chains/solana/sending-txs for more information
export async function signAndSendTransaction(
  request: SolanaUnsignedTransaction<Network>,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
) {
  if (!wallet) throw new Error('Wallet not found');
  if (!config.rpcs.Solana) throw new Error('Solana RPC not found');

  const commitment = options?.commitment ?? 'finalized';
  const unsignedTx = request.transaction.transaction;
  const connection = new Connection(config.rpcs.Solana);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);

  if (isVersionedTransaction(unsignedTx)) {
    const message = TransactionMessage.decompile(unsignedTx.message);
    message.recentBlockhash = blockhash;
    message.instructions.push(
      ...(await createPriorityFeeInstructions(connection, unsignedTx)),
    );
    unsignedTx.message = message.compileToV0Message();
    unsignedTx.sign(request.transaction.signers ?? []);
  } else {
    unsignedTx.recentBlockhash = blockhash;
    unsignedTx.lastValidBlockHeight = lastValidBlockHeight;
    unsignedTx.add(
      ...(await createPriorityFeeInstructions(connection, unsignedTx)),
    );
    if (request.transaction.signers) {
      unsignedTx.partialSign(...request.transaction.signers);
    }
  }

  let confirmTransactionPromise: Promise<
    RpcResponseAndContext<SignatureResult>
  > | null = null;
  let confirmedTx: RpcResponseAndContext<SignatureResult> | null = null;
  let txSendAttempts = 1;
  let signature = '';
  // TODO: VersionedTransaction is supported, but the interface needs to be updated
  const tx = await wallet.signTransaction(unsignedTx as Transaction);
  const serializedTx = tx.serialize();
  const sendOptions = {
    skipPreflight: true,
    maxRetries: 0,
    preFlightCommitment: commitment, // See PR and linked issue for why setting this matters: https://github.com/anza-xyz/agave/pull/483
  };
  signature = await connection.sendRawTransaction(serializedTx, sendOptions);
  confirmTransactionPromise = connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    commitment,
  );

  // This loop will break once the transaction has been confirmed or the block height is exceeded.
  // An exception will be thrown if the block height is exceeded by the confirmTransactionPromise.
  // The transaction will be resent if it hasn't been confirmed after the interval.
  const txRetryInterval = 5000;
  while (!confirmedTx) {
    confirmedTx = await Promise.race([
      confirmTransactionPromise,
      new Promise<null>((resolve) =>
        setTimeout(() => {
          resolve(null);
        }, txRetryInterval),
      ),
    ]);
    if (confirmedTx) {
      break;
    }
    console.log(
      `Tx not confirmed after ${
        txRetryInterval * txSendAttempts++
      }ms, resending`,
    );
    try {
      await connection.sendRawTransaction(serializedTx, sendOptions);
    } catch (e) {
      console.error('Failed to resend transaction:', e);
    }
  }

  if (confirmedTx.value.err) {
    throw new Error(`Transaction failed: ${confirmedTx.value.err}`);
  }

  return signature;
}

// this will throw if the simulation fails
async function createPriorityFeeInstructions(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  commitment?: Commitment,
) {
  if (isVersionedTransaction(transaction)) {
    // This is required for versioned transactions - simulateTransaction throws
    // if recentBlockhash is an empty string.
    const { blockhash } = await connection.getLatestBlockhash(commitment);
    transaction.message.recentBlockhash = blockhash;
  }

  const response = await (isVersionedTransaction(transaction)
    ? connection.simulateTransaction(transaction, {
        commitment,
        replaceRecentBlockhash: true,
      })
    : connection.simulateTransaction(transaction));
  if (response.value.err) {
    throw new Error(`Simulation failed: ${response.value.err}`);
  }
  const instructions: TransactionInstruction[] = [];
  if (response.value?.unitsConsumed) {
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        // Set compute budget to 120% of the units used in the simulated transaction
        units: response.value.unitsConsumed * 1.2,
      }),
    );
  }
  const priorityFee = await determinePriorityFee(connection, transaction, 0.75);
  instructions.push(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }),
  );
  return instructions;
}
