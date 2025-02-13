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
  RpcResponseAndContext,
  SignatureResult,
  Transaction,
} from '@solana/web3.js';

import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@xlabs-libs/wallet-aggregator-solana';

import config from 'config';

import { SolanaUnsignedTransaction } from '@wormhole-foundation/sdk-solana';
import { Network } from '@wormhole-foundation/sdk';
import { setPriorityFeeInstructions } from 'utils/solana';

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
    ...(config.ui.walletConnectProjectId
      ? {
          walletConnect: new SolanaWallet(
            new WalletConnectWalletAdapter({
              network: config.isMainnet
                ? SolanaNetwork.Mainnet
                : SolanaNetwork.Devnet,
              options: {
                projectId: config.ui.walletConnectProjectId,
                customStoragePrefix: 'wh-connect-solana-adapter',
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
// See https://docs.triton.one/chains/solana/sending-txs for more information
export async function signAndSendTransaction(
  request: SolanaUnsignedTransaction<Network>,
  wallet: Wallet | undefined,
  options?: ConfirmOptions,
) {
  if (!wallet) throw new Error('Wallet not found');
  if (!config.rpcs.Solana) throw new Error('Solana RPC not found');

  const commitment = options?.commitment ?? 'finalized';
  const connection = new Connection(config.rpcs.Solana);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);

  const unsignedTx = await setPriorityFeeInstructions(
    connection,
    blockhash,
    lastValidBlockHeight,
    request,
  );

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
    let errorMessage = `Transaction failed: ${confirmedTx.value.err}`;
    if (typeof confirmedTx.value.err === 'object') {
      try {
        errorMessage = `Transaction failed: ${JSON.stringify(
          confirmedTx.value.err,
          (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value, // Handle bigint props
        )}`;
      } catch (e: unknown) {
        // Most likely a circular reference error, we can't stringify this error object.
        // See for more details:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#exceptions
        errorMessage = `Transaction failed: Unknown error`;
      }
    }
    throw new Error(`Transaction failed: ${errorMessage}`);
  }

  return signature;
}
