import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
} from '@solana/web3.js';
import { getTransferWrappedWithPayloadCpiAccounts } from '../../tokenBridge/cpi';
import { createTokenBridgeRelayerProgramInterface } from '../program';
import {
  deriveForeignContractAddress,
  deriveSenderConfigAddress,
  deriveTokenTransferMessageAddress,
  deriveTmpTokenAccountAddress,
  deriveRegisteredTokenAddress,
} from '../accounts';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import { ChainId } from 'types';
import { deriveSignerSequenceAddress } from '../accounts/signerSequence';
import { getWrappedMeta } from '@certusone/wormhole-sdk/lib/esm/solana/tokenBridge';

export async function createTransferWrappedTokensWithRelayInstruction(
  connection: Connection,
  programId: PublicKeyInitData,
  payer: PublicKeyInitData,
  tokenBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  mint: PublicKeyInitData,
  amount: bigint,
  toNativeTokenAmount: bigint,
  recipientAddress: Uint8Array,
  recipientChain: ChainId,
  batchId: number,
): Promise<TransactionInstruction> {
  const {
    methods: { transferWrappedTokensWithRelay },
    account: { signerSequence },
  } = createTokenBridgeRelayerProgramInterface(programId, connection);
  const signerSequenceAddress = deriveSignerSequenceAddress(programId, payer);
  const sequence = await signerSequence
    .fetch(signerSequenceAddress)
    .then(({ value }) => value)
    .catch((e) => {
      if (e.message?.includes('Account does not exist')) {
        // first time transferring
        return new BN(0);
      }
      throw e;
    });

  const message = deriveTokenTransferMessageAddress(programId, payer, sequence);
  const fromTokenAccount = getAssociatedTokenAddressSync(
    new PublicKey(mint),
    new PublicKey(payer),
  );
  const { chain, tokenAddress } = await getWrappedMeta(
    connection,
    tokenBridgeProgramId,
    mint,
  );
  const tmpTokenAccount = deriveTmpTokenAccountAddress(programId, mint);
  const tokenBridgeAccounts = getTransferWrappedWithPayloadCpiAccounts(
    programId,
    tokenBridgeProgramId,
    wormholeProgramId,
    payer,
    message,
    fromTokenAccount,
    chain,
    tokenAddress,
  );

  return transferWrappedTokensWithRelay(
    new BN(amount.toString()),
    new BN(toNativeTokenAmount.toString()),
    recipientChain,
    [...recipientAddress],
    batchId,
  )
    .accounts({
      config: deriveSenderConfigAddress(programId),
      payerSequence: signerSequenceAddress,
      foreignContract: deriveForeignContractAddress(programId, recipientChain),
      registeredToken: deriveRegisteredTokenAddress(
        programId,
        new PublicKey(mint),
      ),
      tmpTokenAccount,
      tokenBridgeProgram: new PublicKey(tokenBridgeProgramId),
      ...tokenBridgeAccounts,
    })
    .instruction();
}
