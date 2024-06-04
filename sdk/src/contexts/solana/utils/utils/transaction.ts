import {
  Transaction,
  Keypair,
  Connection,
  PublicKeyInitData,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
  TransactionSignature,
  Signer,
  Commitment,
} from '@solana/web3.js';

/**
 * Object that holds list of unsigned {@link Transaction}s and {@link Keypair}s
 * required to sign for each transaction.
 */
export interface PreparedTransactions {
  unsignedTransactions: TransactionWithIndex[];
  signers: Signer[];
}

export interface TransactionWithIndex {
  transaction: Transaction;
  signatureIndexes: number[];
  index: number;
}

export interface TransactionSignatureAndResponse {
  signature: TransactionSignature;
  response: RpcResponseAndContext<SignatureResult>;
}

interface SignSendAndConfirmTransactionResponse {
  result: TransactionSignatureAndResponse[];
  errors?: Error[];
}

/**
 * Resembles WalletContextState and Anchor's NodeWallet's signTransaction function signature
 */
export type SignTransaction = (
  transaction: Transaction,
) => Promise<Transaction>;

/**
 *
 * @param payers
 * @returns
 */
export function signTransactionFactory(...payers: Signer[]): SignTransaction {
  return modifySignTransaction(
    (transaction: Transaction) => Promise.resolve(transaction),
    ...payers,
  );
}

export function modifySignTransaction(
  signTransaction: SignTransaction,
  ...payers: Signer[]
): SignTransaction {
  return (transaction: Transaction) => {
    for (const payer of payers) {
      transaction.partialSign(payer);
    }
    return signTransaction(transaction);
  };
}

/**
 * Wrapper for {@link Keypair} resembling Solana web3 browser wallet
 */
export class NodeWallet {
  payer: Keypair;
  signTransaction: SignTransaction;

  constructor(payer: Keypair) {
    this.payer = payer;
    this.signTransaction = signTransactionFactory(this.payer);
  }

  static fromSecretKey(
    secretKey: Uint8Array,
    options?:
      | {
          skipValidation?: boolean | undefined;
        }
      | undefined,
  ): NodeWallet {
    return new NodeWallet(Keypair.fromSecretKey(secretKey, options));
  }

  publicKey(): PublicKey {
    return this.payer.publicKey;
  }

  pubkey(): PublicKey {
    return this.publicKey();
  }

  key(): PublicKey {
    return this.publicKey();
  }

  toString(): string {
    return this.publicKey().toString();
  }

  keypair(): Keypair {
    return this.payer;
  }

  signer(): Signer {
    return this.keypair();
  }
}

/**
 * The transactions provided to this function should be ready to send.
 * This function will do the following:
 * 1. Add the {@param payer} as the feePayer and latest blockhash to the {@link Transaction}.
 * 2. Sign using {@param signTransaction}.
 * 3. Send raw transaction.
 * 4. Confirm transaction.
 */
export async function signSendAndConfirmTransaction(
  connection: Connection,
  payer: PublicKeyInitData,
  signTransaction: SignTransaction,
  unsignedTransaction: Transaction,
  options?: ConfirmOptions,
): Promise<TransactionSignatureAndResponse> {
  const commitment = options?.commitment;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);
  unsignedTransaction.recentBlockhash = blockhash;
  unsignedTransaction.feePayer = new PublicKey(payer);

  // Sign transaction, broadcast, and confirm
  const signed = await signTransaction(unsignedTransaction);
  const signature = await connection.sendRawTransaction(
    signed.serialize(),
    options,
  );
  const response = await connection.confirmTransaction(
    {
      blockhash,
      lastValidBlockHeight,
      signature,
    },
    commitment,
  );
  return { signature, response };
}

/**
 * The transactions provided to this function should be ready to send.
 * This function will do the following:
 * 1. Add the {@param payer} as the feePayer and latest blockhash to the {@link Transaction}.
 * 2. Sign using {@param signTransaction}.
 * 3. Send raw transaction.
 * 4. Confirm transaction.
 */
export async function sendAndConfirmTransactions(
  connection: Connection,
  signTransaction: SignTransaction,
  payer: string,
  unsignedTransactions: Transaction[],
  options?: ConfirmOptions,
): Promise<SignSendAndConfirmTransactionResponse> {
  if (unsignedTransactions.length == 0) {
    return Promise.reject('No transactions provided to send.');
  }

  const commitment = options?.commitment;

  const output: TransactionSignatureAndResponse[] = [];
  const errors: Error[] = [];
  for (const transaction of unsignedTransactions) {
    try {
      const latest = await connection.getLatestBlockhash(commitment);
      transaction.recentBlockhash = latest.blockhash;
      transaction.feePayer = new PublicKey(payer);

      const signed = await signTransaction(transaction).catch((e) => null);
      if (signed === null) {
        return Promise.reject('Failed to sign transaction.');
      }

      const signature = await connection.sendRawTransaction(
        signed.serialize(),
        options,
      );
      const response = await connection.confirmTransaction(
        {
          signature,
          ...latest,
        },
        commitment,
      );
      output.push({ signature, response });
      break;
    } catch (e) {
      console.error(e);
      errors.push(e);
    }
  }

  return { result: await Promise.resolve(output), errors };
}

// This function signs and sends the transaction while constantly checking for confirmation
// and resending the transaction if it hasn't been confirmed after the specified interval
// NOTE: The caller is responsible for simulating the transaction and setting any compute budget
// or priority fee before calling this function
// See https://docs.triton.one/chains/solana/sending-txs for more information
export async function signSendAndConfirmTransaction(
  connection: Connection,
  signTransaction: SignTransaction,
  payer: PublicKeyInitData,
  unsignedTransaction: Transaction,
  commitment: Commitment = 'finalized',
  txRetryInterval = 5000,
): Promise<TransactionSignatureAndResponse> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash({
      commitment,
    });
  unsignedTransaction.recentBlockhash = blockhash;
  unsignedTransaction.feePayer = new PublicKey(payer);
  const tx = await signTransaction(unsignedTransaction);
  let confirmTransactionPromise: Promise<
    RpcResponseAndContext<SignatureResult>
  > | null = null;
  let confirmedTx: RpcResponseAndContext<SignatureResult> | null = null;
  let txSendAttempts = 1;
  let signature = '';
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
  return {
    signature,
    response: confirmedTx,
  };
}
