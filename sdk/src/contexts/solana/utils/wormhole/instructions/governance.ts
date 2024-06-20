import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  isBytes,
  ParsedGovernanceVaa,
  parseGovernanceVaa,
  SignedVaa,
} from '../../../../../vaa';
import { createReadOnlyWormholeProgramInterface } from '../program';
import {
  deriveWormholeBridgeDataKey,
  deriveClaimKey,
  deriveFeeCollectorKey,
  deriveGuardianSetKey,
  derivePostedVaaKey,
  deriveUpgradeAuthorityKey,
} from '../accounts';
import { BpfLoaderUpgradeable, deriveUpgradeableProgramKey } from '../../utils';
export interface SetFeesAccounts {
  payer: PublicKey;
  bridge: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  systemProgram: PublicKey;
}
export interface TransferFeesAccounts {
  payer: PublicKey;
  bridge: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  feeCollector: PublicKey;
  recipient: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
}
export interface UpgradeGuardianSetAccounts {
  payer: PublicKey;
  bridge: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  guardianSetOld: PublicKey;
  guardianSetNew: PublicKey;
  systemProgram: PublicKey;
}
export interface UpgradeContractAccounts {
  payer: PublicKey;
  bridge: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  upgradeAuthority: PublicKey;
  spill: PublicKey;
  implementation: PublicKey;
  programData: PublicKey;
  wormholeProgram: PublicKey;
  rent: PublicKey;
  clock: PublicKey;
  bpfLoaderUpgradeable: PublicKey;
  systemProgram: PublicKey;
}
