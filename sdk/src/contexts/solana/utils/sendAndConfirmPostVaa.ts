import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  PublicKeyInitData,
  Transaction,
} from '@solana/web3.js';
import {
  SignTransaction,
  sendAndConfirmTransactionsWithRetry,
  modifySignTransaction,
  TransactionSignatureAndResponse,
  PreparedTransactions,
} from './utils';
import { addComputeBudget } from './computeBudget';
import {
  createPostVaaInstruction,
  createVerifySignaturesInstructions,
  derivePostedVaaKey,
} from './wormhole';
import { isBytes, ParsedVaa, parseVaa, SignedVaa } from '../../../vaa/wormhole';

/**
 * @category Solana
 */
export async function postVaaWithRetry(
  connection: Connection,
  signTransaction: SignTransaction,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  vaa: Buffer,
  maxRetries?: number,
  commitment?: Commitment,
): Promise<TransactionSignatureAndResponse[]> {
  try {
    // Check if the VAA has already been posted
    const parsedVaa = parseVaa(vaa);
    const postedVaaAddress = derivePostedVaaKey(
      wormholeProgramId,
      parsedVaa.hash,
    );
    const postedVaa = await connection.getAccountInfo(postedVaaAddress);
    if (postedVaa !== null) {
      return [];
    }
  } catch (e) {
    console.error('Failed to check if VAA has already been posted:', e);
  }
  const { unsignedTransactions, signers } =
    await createPostSignedVaaTransactions(
      connection,
      wormholeProgramId,
      payer,
      vaa,
      commitment,
    );
  const postVaaTransaction = unsignedTransactions.pop();
  if (!postVaaTransaction) throw new Error('No postVaaTransaction');
  postVaaTransaction.feePayer = new PublicKey(payer);

  for (const unsignedTransaction of unsignedTransactions) {
    unsignedTransaction.feePayer = new PublicKey(payer);
    await addComputeBudget(connection, unsignedTransaction, [], 0.75, 1, true);
  }
  const responses = await sendAndConfirmTransactionsWithRetry(
    connection,
    modifySignTransaction(signTransaction, ...signers),
    payer.toString(),
    unsignedTransactions,
    maxRetries,
    commitment,
  );
  //While the signature_set is used to create the final instruction, it doesn't need to sign it.
  await addComputeBudget(connection, postVaaTransaction, [], 0.75, 1, true);
  responses.push(
    ...(await sendAndConfirmTransactionsWithRetry(
      connection,
      signTransaction,
      payer.toString(),
      [postVaaTransaction],
      maxRetries,
      commitment,
    )),
  );
  return responses;
}

/**
 * @category Solana
 *
 * Send transactions for `verify_signatures` and `post_vaa` instructions.
 *
 * Using a signed VAA, execute transactions generated by {@link verifySignatures} and
 * {@link postVaa}. At most 4 transactions are sent (up to 3 from signature verification
 * and 1 to post VAA data to an account).
 *
 * @param {Connection} connection - Solana web3 connection
 * @param {PublicKeyInitData} wormholeProgramId - wormhole program address
 * @param {web3.Keypair} payer - transaction signer address
 * @param {Buffer} signedVaa - bytes of signed VAA
 * @param {Commitment} [options] - Solana commitment
 *
 */
export async function createPostSignedVaaTransactions(
  connection: Connection,
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
  vaa: SignedVaa | ParsedVaa,
  commitment?: Commitment,
): Promise<PreparedTransactions> {
  const parsed = isBytes(vaa) ? parseVaa(vaa) : vaa;
  const signatureSet = Keypair.generate();

  const verifySignaturesInstructions = await createVerifySignaturesInstructions(
    connection,
    wormholeProgramId,
    payer,
    parsed,
    signatureSet.publicKey,
    commitment,
  );

  const unsignedTransactions: Transaction[] = [];
  for (let i = 0; i < verifySignaturesInstructions.length; i += 2) {
    unsignedTransactions.push(
      new Transaction().add(...verifySignaturesInstructions.slice(i, i + 2)),
    );
  }

  unsignedTransactions.push(
    new Transaction().add(
      createPostVaaInstruction(
        connection,
        wormholeProgramId,
        payer,
        parsed,
        signatureSet.publicKey,
      ),
    ),
  );

  return {
    unsignedTransactions,
    signers: [signatureSet],
  };
}
