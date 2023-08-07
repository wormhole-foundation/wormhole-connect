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
  deriveRelayerFeeAddress,
} from '../accounts';
import { getProgramSequenceTracker } from '../../wormhole';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { getWrappedMeta } from '../../tokenBridge';
import { BN } from '@project-serum/anchor';
import { ChainId } from 'types';

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
      foreignContract: deriveForeignContractAddress(programId, recipientChain),
      registeredToken: deriveRegisteredTokenAddress(
        programId,
        new PublicKey(mint),
      ),
      relayerFee: deriveRelayerFeeAddress(programId, recipientChain),
      tmpTokenAccount,
      tokenBridgeProgram: new PublicKey(tokenBridgeProgramId),
      ...tokenBridgeAccounts,
    })
    .instruction();
}
