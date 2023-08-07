import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { deriveAddress } from '../../utils';

export interface RedeemerConfig {
  owner: PublicKey;
  bump: number;
  relayerFeePrecision: number;
  swapRatePrecision: number;
  feeRecipient: PublicKey;
}

export function deriveRedeemerConfigAddress(
  programId: PublicKeyInitData,
): PublicKey {
  return deriveAddress([Buffer.from('redeemer')], programId);
}
