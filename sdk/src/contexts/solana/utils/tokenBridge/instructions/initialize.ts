import {
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { createReadOnlyTokenBridgeProgramInterface } from '../program';
import { deriveTokenBridgeConfigKey } from '../accounts';
export interface InitializeAccounts {
  payer: PublicKey;
  config: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
}
