import { deriveAddress } from '../../utils';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';

export function deriveTmpTokenAccountAddress(
  programId: PublicKeyInitData,
  mint: PublicKeyInitData,
): PublicKey {
  return deriveAddress(
    [Buffer.from('tmp'), new PublicKey(mint).toBuffer()],
    programId,
  );
}
