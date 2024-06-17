import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { createReadOnlyNftBridgeProgramInterface } from '../program';
import { deriveNftBridgeConfigKey } from '../accounts';
export interface InitializeAccounts {
  payer: PublicKey;
  config: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
}
export function getInitializeAccounts(
  nftBridgeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
): InitializeAccounts {
  return {
    payer: new PublicKey(payer),
    config: deriveNftBridgeConfigKey(nftBridgeProgramId),
    rent: SYSVAR_RENT_PUBKEY,
    systemProgram: SystemProgram.programId,
  };
}
