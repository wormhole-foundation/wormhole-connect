import { BN } from '@project-serum/anchor';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { deriveAddress } from '../../utils';

export interface RegisteredToken {
  swapRate: BN;
  maxNativeSwapAmount: BN;
  isRegistered: boolean;
}

export function deriveRegisteredTokenAddress(
  programId: PublicKeyInitData,
  mint: PublicKeyInitData,
): PublicKey {
  return deriveAddress(
    [Buffer.from('mint'), new PublicKey(mint).toBuffer()],
    programId,
  );
}
