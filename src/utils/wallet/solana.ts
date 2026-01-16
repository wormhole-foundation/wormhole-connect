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
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  Transaction,
  TransactionError,
} from '@solana/web3.js';
import { clusterApiUrl, Connection } from '@solana/web3.js';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@wormhole-labs/wallet-aggregator-solana';

import config from 'config';

const CONFIRMATION_PROMISE_TIMER = 3_000; // How long to wait for confirmation before resending

import type { SolanaUnsignedTransaction } from '@wormhole-foundation/sdk-solana';
import type { Chain, Network } from '@wormhole-foundation/sdk';
import { setPriorityFeeInstructions } from 'utils/solana';
import { retry } from 'es-toolkit';
import { stringifyWithBigInt } from 'utils';

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

  const wallets = getSolanaStandardWallets(connection).reduce((acc, w) => {
    const name = getWalletName(w).toLowerCase();
    if (name === 'leap' || name === 'backpack') {
      acc.leap = w;
    }
    return acc;
  }, {} as Record<string, Wallet>);

  return {
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    ...wallets,
  };
}

/**
 * This function signs and sends the transaction while constantly checking for confirmation
 * and resending the transaction if it hasn't been confirmed after the specified interval
 * See https://docs.triton.one/chains/solana/sending-txs for more information.
 *
 * @param request The unsigned transaction to sign and send
 * @param wallet The wallet to use for signing and sending the transaction
 * @param options Optional confirmation options
 * @returns The transaction signature
 */
export async function signAndSendTransactionWithResends(
  request: SolanaUnsignedTransaction<Network>,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
): Promise<string> {
  if (!wallet) throw new Error('Wallet not found');
  const rpc = config.rpcs[request.chain];
  if (!rpc) throw new Error(`${request.chain} RPC not found`);

  let commitment = options?.commitment ?? 'confirmed';
  const connection = new Connection(rpc);

  // HACK: For certain transactions we need to use 'finalized' commitment, such as when posting a VAA.
  // If you use 'confirmed' here, the Core.PostVaa transaction will fail with "Unexpected length of input"
  // and it's not clear why.
  if (
    request.description === 'Core.VerifySignature' ||
    request.description === 'Core.PostVAA'
  ) {
    commitment = 'finalized';
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);

  // Create tx
  const { serializedTransaction, sendOptions } = await createSolanaTransaction(
    request,
    wallet,
    connection,
    blockhash,
    lastValidBlockHeight,
    commitment,
  );

  const transaction = { serializedTransaction, sendOptions };

  const signature = await resendTransactionUntilConfirmed(
    connection,
    transaction,
    blockhash,
    lastValidBlockHeight,
    commitment,
  );

  return signature;
}

/**
 * **We race against the confirmation promise to mitigate the risk of the transaction
 * not being confirmed before the blockhash expires.**
 *
 * If the confirmation promise resolves slower than the `txRetryInterval`, we resend.
 * This is for performance.
 *
 * @param signature The transaction signature
 * @param connection The Solana connection object
 * @param transaction The transaction to resend
 */

async function resendTransactionUntilConfirmed(
  connection: Connection,
  transaction: {
    serializedTransaction: Uint8Array | Buffer | number[];
    sendOptions?: SendOptions;
  },
  blockhash: string,
  lastValidBlockHeight: number,
  commitment: Commitment,
): Promise<string> {
  let isTransactionConfirmed: RpcResponseAndContext<SignatureResult> | null =
    null;

  const signature = await connection.sendRawTransaction(
    transaction.serializedTransaction,
    transaction.sendOptions,
  );

  const confirmPromise = connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    commitment,
  );

  try {
    while (!isTransactionConfirmed) {
      isTransactionConfirmed = await Promise.race([
        confirmPromise,
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), CONFIRMATION_PROMISE_TIMER),
        ),
      ]);

      if (isTransactionConfirmed) {
        break;
      }

      // Resend transaction as it's not yet confirmed
      await connection.sendRawTransaction(
        transaction.serializedTransaction,
        transaction.sendOptions,
      );
    }
  } catch (e) {
    if (
      e instanceof Error &&
      e.name === 'TransactionExpiredBlockheightExceededError'
    ) {
      await recoverBlockheightExceededTransaction(connection, signature);
      return signature;
    }
    throw e;
  }

  if (isTransactionConfirmed?.value.err) {
    const errorMessage = formatConfirmationError(
      isTransactionConfirmed.value.err,
    );
    throw new Error(`Transaction failed: ${errorMessage}`);
  }

  return signature;
}

/**
 * Attempt to recover a transaction that exceeded its blockheight,
 * by polling until it appears on chain.
 *
 * @param connection Solana RPC connection
 * @param signature The transaction signature to look up
 * @param retries Number of retries (default: 5)
 * @param delay Delay between retries in ms (default: 2000)
 * @returns The signature once found, or throws if retries are exhausted
 */
async function recoverBlockheightExceededTransaction(
  connection: Connection,
  signature: string,
  { retries = 5, delay = 2000 }: { retries?: number; delay?: number } = {},
) {
  const findTransaction = async () => {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (tx) return;
  };

  retry(findTransaction, { retries, delay });
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

function formatConfirmationError(err: TransactionError): string {
  if (!err) return 'Unknown error';

  if (typeof err === 'object') {
    try {
      return stringifyWithBigInt(err);
    } catch {
      return 'Unstringifiable error object';
    }
  }

  return String(err);
}
