import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  PublicKeyInitData,
} from '@solana/web3.js';
import {
  TransactionWithIndex,
  deriveAddress,
  getAccountData,
} from '../../utils';
import { MessageData } from '../message';
import { getSignatureSetData } from './signatureSet';

export class PostedMessageData {
  message: MessageData;

  constructor(message: MessageData) {
    this.message = message;
  }

  static deserialize(data: Buffer) {
    return new PostedMessageData(MessageData.deserialize(data.subarray(3)));
  }
}

export class PostedVaaData extends PostedMessageData {}

export function derivePostedVaaKey(
  wormholeProgramId: PublicKeyInitData,
  hash: Buffer,
): PublicKey {
  return deriveAddress([Buffer.from('PostedVAA'), hash], wormholeProgramId);
}

export async function getPostedVaa(
  connection: Connection,
  wormholeProgramId: PublicKeyInitData,
  hash: Buffer,
  commitment?: Commitment,
): Promise<PostedVaaData> {
  return connection
    .getAccountInfo(derivePostedVaaKey(wormholeProgramId, hash), commitment)
    .then((info) => PostedVaaData.deserialize(getAccountData(info)));
}

export async function getPostedMessage(
  connection: Connection,
  messageKey: PublicKeyInitData,
  commitment?: Commitment,
): Promise<PostedMessageData> {
  return connection
    .getAccountInfo(new PublicKey(messageKey), commitment)
    .then((info) => PostedMessageData.deserialize(getAccountData(info)));
}

export async function verifiedSignatures(
  transaction: TransactionWithIndex,
  connection: Connection,
  signatureSet: Keypair,
  commitment?: Commitment,
): Promise<boolean> {
  if (transaction.signatureIndexes.length === 0) {
    return false;
  }
  console.log(
    'verifiedSignatures',
    transaction,
    connection,
    signatureSet,
    commitment,
  );
  const signatureSetData = await getSignatureSetData(
    connection,
    signatureSet?.publicKey,
    commitment,
  );

  const firstRelatedSignature =
    signatureSetData?.signatures[transaction.signatureIndexes[0]];

  return firstRelatedSignature !== undefined && firstRelatedSignature;
}

export async function pendingSignatureVerificationTxs(
  transactions: TransactionWithIndex[],
  connection: Connection,
  wormholeProgramId: PublicKeyInitData,
  signatureSet: Keypair,
  commitment?: Commitment,
): Promise<TransactionWithIndex[]> {
  const txs: TransactionWithIndex[] = [];
  for (const tx of transactions) {
    const isPresent = await verifiedSignatures(
      tx,
      connection,
      signatureSet,
      commitment,
    );
    if (!isPresent) {
      console.info(
        `Transaction ${tx.signatureIndexes.length} not present on blockchain`,
      );
      txs.push(tx);
    }
  }
  return txs;
}
