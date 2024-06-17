import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { createReadOnlyWormholeProgramInterface } from '../program';
import {
  deriveFeeCollectorKey,
  deriveGuardianSetKey,
  deriveWormholeBridgeDataKey,
} from '../accounts';
import BN from 'bn.js';
export interface InitializeAccounts {
  bridge: PublicKey;
  guardianSet: PublicKey;
  feeCollector: PublicKey;
  payer: PublicKey;
  clock: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
}
export function getInitializeAccounts(
  wormholeProgramId: PublicKeyInitData,
  payer: PublicKeyInitData,
): InitializeAccounts {
  return {
    bridge: deriveWormholeBridgeDataKey(wormholeProgramId),
    guardianSet: deriveGuardianSetKey(wormholeProgramId, 0),
    feeCollector: deriveFeeCollectorKey(wormholeProgramId),
    payer: new PublicKey(payer),
    clock: SYSVAR_CLOCK_PUBKEY,
    rent: SYSVAR_RENT_PUBKEY,
    systemProgram: SystemProgram.programId,
  };
}
