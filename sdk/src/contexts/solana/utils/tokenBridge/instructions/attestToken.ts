import {
  Connection,
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction,
} from '@solana/web3.js';
import { createReadOnlyTokenBridgeProgramInterface } from '../program';
import { getPostMessageAccounts } from '../../wormhole';
import {
  deriveSplTokenMetadataKey,
  deriveTokenBridgeConfigKey,
  deriveWrappedMetaKey,
} from '../accounts';
export interface AttestTokenAccounts {
  payer: PublicKey;
  config: PublicKey;
  mint: PublicKey;
  wrappedMeta: PublicKey;
  splMetadata: PublicKey;
  wormholeBridge: PublicKey;
  wormholeMessage: PublicKey;
  wormholeEmitter: PublicKey;
  wormholeSequence: PublicKey;
  wormholeFeeCollector: PublicKey;
  clock: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
  wormholeProgram: PublicKey;
}
