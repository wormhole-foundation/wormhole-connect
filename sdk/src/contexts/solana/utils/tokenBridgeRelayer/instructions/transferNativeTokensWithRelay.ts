import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
} from '@solana/web3.js';
import { getTransferNativeWithPayloadCpiAccounts } from '../../tokenBridge/cpi';
import { createTokenBridgeRelayerProgramInterface } from '../program';
import {
  deriveForeignContractAddress,
  deriveSenderConfigAddress,
  deriveTokenTransferMessageAddress,
  deriveRegisteredTokenAddress,
  deriveRelayerFeeAddress,
  deriveTmpTokenAccountAddress,
} from '../accounts';
import { getProgramSequenceTracker } from '../../wormhole';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import { ChainId } from 'types';

export async function createTransferNativeTokensWithRelayInstruction(
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
  wrapNative: boolean,
): Promise<TransactionInstruction> {
  const {
    methods: { transferNativeTokensWithRelay },
  } = createTokenBridgeRelayerProgramInterface(programId, connection);
  const { sequence } = await getProgramSequenceTracker(
    connection,
    tokenBridgeProgramId,
    wormholeProgramId,
  );
  const message = deriveTokenTransferMessageAddress(programId, sequence);
  const fromTokenAccount = getAssociatedTokenAddressSync(
    new PublicKey(mint),
    new PublicKey(payer),
  );
  const tmpTokenAccount = deriveTmpTokenAccountAddress(programId, mint);
  const tokenBridgeAccounts = getTransferNativeWithPayloadCpiAccounts(
    programId,
    tokenBridgeProgramId,
    wormholeProgramId,
    payer,
    message,
    fromTokenAccount,
    mint,
  );
  return transferNativeTokensWithRelay(
    new BN(amount.toString()),
    new BN(toNativeTokenAmount.toString()),
    recipientChain,
    [...recipientAddress],
    batchId,
    wrapNative,
  )
    .accounts({
      config: deriveSenderConfigAddress(programId),
      foreignContract: deriveForeignContractAddress(programId, recipientChain),
      registeredToken: deriveRegisteredTokenAddress(programId, mint),
      relayerFee: deriveRelayerFeeAddress(programId, recipientChain),
      tmpTokenAccount,
      tokenBridgeProgram: new PublicKey(tokenBridgeProgramId),
      ...tokenBridgeAccounts,
    })
    .instruction();
}
