import { WalletAdapterNetwork as SolanaNetwork } from '@solana/wallet-adapter-base';

import type { Wallet } from '@wormhole-labs/wallet-aggregator-core';
import {
  BitgetWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SolongWalletAdapter,
  TorusWalletAdapter,
  NightlyWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import type {
  Commitment,
  ConfirmOptions,
  SendOptions,
  Transaction,
} from '@solana/web3.js';
import { clusterApiUrl, Connection } from '@solana/web3.js';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@wormhole-labs/wallet-aggregator-solana';

import config from 'config';

import type { SolanaUnsignedTransaction } from '@wormhole-foundation/sdk-solana';
import type { Chain, Network } from '@wormhole-foundation/sdk';
import { setPriorityFeeInstructions } from 'utils/solana';
import { retry } from 'es-toolkit';

const getWalletName = (wallet: Wallet) =>
  wallet.getName().toLowerCase().replaceAll('wallet', '').trim();

export function fetchOptions(chain: Chain) {
  if (chain === 'Solana') {
    return fetchSolanaOptions();
  } else if (chain === 'Fogo') {
    return fetchFogoOptions();
  }

  throw new Error(`Unsupported chain: ${chain}`);
}

export function fetchSolanaOptions() {
  const tag = config.isMainnet ? SolanaNetwork.Mainnet : SolanaNetwork.Devnet;
  const connection = new Connection(config.rpcs.Solana || clusterApiUrl(tag));

  const wallets = getSolanaStandardWallets(connection).reduce((acc, w) => {
    acc[getWalletName(w)] = w;
    return acc;
  }, {} as Record<string, Wallet>);

  let walletConnect: Record<string, Wallet> = {};
  if (config.ui.walletConnectProjectId) {
    walletConnect = {
      walletConnect: new SolanaWallet(
        new WalletConnectWalletAdapter({
          network: tag,
          options: {
            projectId: config.ui.walletConnectProjectId,
            customStoragePrefix: 'wh-connect-solana-adapter',
          },
        }),
        connection,
      ),
    };
  }

  return {
    ...wallets,
    bitget: new SolanaWallet(new BitgetWalletAdapter(), connection),
    clover: new SolanaWallet(new CloverWalletAdapter(), connection),
    coin98: new SolanaWallet(new Coin98WalletAdapter(), connection),
    solong: new SolanaWallet(new SolongWalletAdapter(), connection),
    torus: new SolanaWallet(new TorusWalletAdapter(), connection),
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    ...walletConnect,
  };
}

export function fetchFogoOptions() {
  if (!config.rpcs.Fogo) throw new Error('Fogo RPC not found');

  const connection = new Connection(config.rpcs.Fogo);

  // Only Nightly and Leap support Fogo natively currently

  const wallets = getSolanaStandardWallets(connection).reduce((acc, w) => {
    const name = getWalletName(w).toLowerCase();
    if (name === 'leap') {
      acc.leap = w;
    }
    return acc;
  }, {} as Record<string, Wallet>);

  return {
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    ...wallets,
  };
}

// This function signs and sends the transaction while constantly checking for confirmation
// and resending the transaction if it hasn't been confirmed after the specified interval
// See https://docs.triton.one/chains/solana/sending-txs for more information

/*

  This function signs and sends the transaction, no confirmation checking.

*/
export async function signAndSendTransactionWithRetry(
  request: SolanaUnsignedTransaction<Network>,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
): Promise<string> {
  if (!wallet) throw new Error('Wallet not found');
  const rpc = config.rpcs[request.chain];
  if (!rpc) throw new Error(`${request.chain} RPC not found`);

  const commitment = options?.commitment ?? 'finalized';
  const connection = new Connection(rpc);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);

  const { serializedTransaction, sendOptions } = await createSolanaTransaction(
    request,
    wallet,
    connection,
    blockhash,
    lastValidBlockHeight,
    commitment,
  );

  const signature = await connection.sendRawTransaction(
    serializedTransaction,
    sendOptions,
  );

  waitForConfirmation(
    signature,
    { serializedTransaction, sendOptions },
    connection,
    blockhash,
    lastValidBlockHeight,
    commitment,
  );

  return signature;
}

async function waitForConfirmation(
  signature: string,
  transaction: {
    serializedTransaction: Uint8Array | Buffer | number[];
    sendOptions?: SendOptions;
  },
  connection: Connection,
  blockHash: string,
  lastValidBlockHeight: number,
  commitment?: Commitment,
) {
  let currentSignature = signature;
  let confirmTransactionPromise = await connection.confirmTransaction(
    {
      signature: currentSignature,
      blockhash: blockHash,
      lastValidBlockHeight,
    },
    commitment,
  );
  if (!confirmTransactionPromise.value.err) {
    return confirmTransactionPromise;
  }

  try {
    let hasTransactionBeenResent = false;
    const NO_OF_RETRIES = 5;
    const RETRY_DELAY = 1000;

    await retry(
      () => {
        return (async () => {
          try {
            confirmTransactionPromise = await connection.confirmTransaction(
              {
                signature,
                blockhash: blockHash,
                lastValidBlockHeight,
              },
              commitment,
            );

            const isTransactionSuccessful =
              !confirmTransactionPromise.value.err;

            if (isTransactionSuccessful) {
              return confirmTransactionPromise;
            }

            if (!isTransactionSuccessful && !hasTransactionBeenResent) {
              console.log(
                'Transaction confirmation failed, resending transaction...',
              );

              try {
                currentSignature = await connection.sendRawTransaction(
                  transaction.serializedTransaction,
                  transaction.sendOptions,
                );

                hasTransactionBeenResent = true;
              } catch (resendError) {
                console.error('Failed to resend transaction:', resendError);

                // If resend failed, still throw the original confirmation error
                let errorMessage = `Transaction failed: ${confirmTransactionPromise.value.err}`;
                if (typeof confirmTransactionPromise.value.err === 'object') {
                  try {
                    errorMessage = `Transaction failed: ${JSON.stringify(
                      confirmTransactionPromise.value.err,
                      (_key, value) =>
                        typeof value === 'bigint' ? value.toString() : value,
                    )}`;
                  } catch (e: unknown) {
                    throw new Error(`Transaction failed: Unknown error`);
                  }
                }
                throw new Error(errorMessage);
              }
            }
          } catch (e) {
            console.error('Failed to confirm transaction:', e);
            throw e;
          }
        })();
      },
      {
        retries: NO_OF_RETRIES,
        delay: RETRY_DELAY,
      },
    );
  } catch (e: unknown) {
    checkTransactionLanded(e, connection, signature);
    throw e;
  }
}

async function checkTransactionLanded(
  e: unknown,
  connection: Connection,
  signature: string,
  { retries = 5, delay = 2000 }: { retries?: number; delay?: number } = {},
): Promise<string | null> {
  if (
    e instanceof Error &&
    e.name === 'TransactionExpiredBlockheightExceededError'
  ) {
    return retry(
      async () => {
        const tx = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          throw new Error('Transaction not yet found on chain');
        }

        return signature;
      },
      { retries, delay },
    ).catch(() => null); // return null if all retries fail
  }

  return Promise.resolve(null);
}

async function createSolanaTransaction(
  request: SolanaUnsignedTransaction<Network>,
  wallet: Wallet,
  connection: Connection,
  blockHash: string,
  lastValidBlockHeight: number,
  commitment?: Commitment,
): Promise<{
  serializedTransaction: Uint8Array | Buffer | number[];
  sendOptions?: SendOptions;
}> {
  const txToSign = await setPriorityFeeInstructions(
    connection,
    blockHash,
    lastValidBlockHeight,
    request,
  );
  // TODO: VersionedTransaction is supported, but the interface needs to be updated
  const tx = await wallet.signTransaction(txToSign as Transaction);
  const serializedTx = tx.serialize();
  const sendOptions = {
    skipPreflight: true,
    maxRetries: 0,
    preFlightCommitment: commitment, // See PR and linked issue for why setting this matters: https://github.com/anza-xyz/agave/pull/483
  };
  return { serializedTransaction: serializedTx, sendOptions };
}
