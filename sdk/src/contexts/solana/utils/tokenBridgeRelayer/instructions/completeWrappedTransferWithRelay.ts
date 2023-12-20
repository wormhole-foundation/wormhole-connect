import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
} from '@solana/web3.js';
import { getCompleteTransferWrappedWithPayloadCpiAccounts } from '../../tokenBridge/cpi';
import { createTokenBridgeRelayerProgramInterface } from '../program';
import {
  deriveForeignContractAddress,
  deriveRedeemerConfigAddress,
  deriveRegisteredTokenAddress,
  deriveTmpTokenAccountAddress,
} from '../accounts';
import { NATIVE_MINT, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { deriveWrappedMintKey } from '../../tokenBridge/accounts';
import { SignedVaa, parseTokenTransferVaa } from '../../../../../vaa';
import { ChainId } from '../../../../../types';

export async function createCompleteWrappedTransferWithRelayInstruction(
  connection: Connection,
  programId: PublicKeyInitData,
  payer: PublicKeyInitData,
  tokenBridgeProgramId: PublicKeyInitData,
  wormholeProgramId: PublicKeyInitData,
  signedVaa: SignedVaa,
  recipient: PublicKey,
): Promise<TransactionInstruction> {
  const relayer = createTokenBridgeRelayerProgramInterface(
    programId,
    connection,
  );
  const { tokenChain, tokenAddress, emitterChain, hash } =
    parseTokenTransferVaa(signedVaa);
  const wrappedMint = deriveWrappedMintKey(
    tokenBridgeProgramId,
    tokenChain,
    tokenAddress,
  );
  const tmpTokenAccount = deriveTmpTokenAccountAddress(programId, wrappedMint);
  const tokenBridgeAccounts = getCompleteTransferWrappedWithPayloadCpiAccounts(
    tokenBridgeProgramId,
    wormholeProgramId,
    payer,
    signedVaa,
    tmpTokenAccount,
  );
  const recipientTokenAccount = getAssociatedTokenAddressSync(
    wrappedMint,
    recipient,
  );
  const redeemerConfigAddress = deriveRedeemerConfigAddress(programId);
  const { feeRecipient } = await relayer.account.redeemerConfig.fetch(
    redeemerConfigAddress,
  );
  const feeRecipientTokenAccount = getAssociatedTokenAddressSync(
    wrappedMint,
    feeRecipient,
  );
  return relayer.methods
    .completeWrappedTransferWithRelay([...hash])
    .accounts({
      config: redeemerConfigAddress,
      foreignContract: deriveForeignContractAddress(
        programId,
        emitterChain as ChainId,
      ),
      tmpTokenAccount,
      registeredToken: deriveRegisteredTokenAddress(programId, wrappedMint),
      nativeRegisteredToken: deriveRegisteredTokenAddress(
        programId,
        NATIVE_MINT,
      ),
      recipientTokenAccount,
      recipient,
      feeRecipientTokenAccount,
      tokenBridgeProgram: new PublicKey(tokenBridgeProgramId),
      ...tokenBridgeAccounts,
    })
    .instruction();
}
