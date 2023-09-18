import { deriveAddress } from '../../utils';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

export interface SignerSequence {
  value: BN;
}

export function deriveSignerSequenceAddress(
  programId: PublicKeyInitData,
  payerKey: PublicKeyInitData,
): PublicKey {
  return deriveAddress(
    [Buffer.from('seq'), new PublicKey(payerKey).toBuffer()],
    programId,
  );
}
