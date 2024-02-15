import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
} from '@solana/web3.js';
import { getCompleteTransferNativeWithPayloadCpiAccounts } from '../../tokenBridge/cpi';
import { createTokenBridgeRelayerProgramInterface } from '../program';
import {
  deriveForeignContractAddress,
  deriveRedeemerConfigAddress,
  deriveRegisteredTokenAddress,
  deriveTmpTokenAccountAddress,
} from '../accounts';
import { NATIVE_MINT, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { ChainId } from '../../../../../types';
import { SignedVaa, parseTokenTransferVaa } from '../../../../../vaa';

export async function createCompleteNativeTransferWithRelayInstruction(
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
  const { tokenAddress, emitterChain, hash } = parseTokenTransferVaa(signedVaa);
  const mint = new PublicKey(tokenAddress);
  const tmpTokenAccount = deriveTmpTokenAccountAddress(programId, mint);
  const tokenBridgeAccounts = getCompleteTransferNativeWithPayloadCpiAccounts(
    tokenBridgeProgramId,
    wormholeProgramId,
    payer,
    signedVaa,
    tmpTokenAccount,
  );
  const recipientTokenAccount = getAssociatedTokenAddressSync(mint, recipient);
  const redeemerConfigAddress = deriveRedeemerConfigAddress(programId);
  const { feeRecipient } = await relayer.account.redeemerConfig.fetch(
    redeemerConfigAddress,
  );
  const feeRecipientTokenAccount = getAssociatedTokenAddressSync(
    mint,
    feeRecipient,
  );
  return relayer.methods
    .completeNativeTransferWithRelay([...hash])
    .accounts({
      config: redeemerConfigAddress,
      foreignContract: deriveForeignContractAddress(
        programId,
        emitterChain as ChainId,
      ),
      tmpTokenAccount,
      registeredToken: deriveRegisteredTokenAddress(programId, mint),
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
