import {
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { createReadOnlyTokenBridgeProgramInterface } from '../program';
import { deriveClaimKey, derivePostedVaaKey } from '../../wormhole';
import {
  deriveEndpointKey,
  deriveTokenBridgeConfigKey,
  deriveUpgradeAuthorityKey,
} from '../accounts';
import {
  isBytes,
  ParsedTokenBridgeRegisterChainVaa,
  ParsedTokenBridgeUpgradeContractVaa,
  parseTokenBridgeRegisterChainVaa,
  parseTokenBridgeUpgradeContractVaa,
  SignedVaa,
} from '../../../../../vaa';
import { BpfLoaderUpgradeable, deriveUpgradeableProgramKey } from '../../utils';
export interface RegisterChainAccounts {
  payer: PublicKey;
  config: PublicKey;
  endpoint: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
  wormholeProgram: PublicKey;
}
export interface UpgradeContractAccounts {
  payer: PublicKey;
  vaa: PublicKey;
  claim: PublicKey;
  upgradeAuthority: PublicKey;
  spill: PublicKey;
  implementation: PublicKey;
  programData: PublicKey;
  tokenBridgeProgram: PublicKey;
  rent: PublicKey;
  clock: PublicKey;
  bpfLoaderUpgradeable: PublicKey;
  systemProgram: PublicKey;
}
