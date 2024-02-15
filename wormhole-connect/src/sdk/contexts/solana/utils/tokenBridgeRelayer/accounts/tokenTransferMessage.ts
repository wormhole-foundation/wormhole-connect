import { deriveAddress } from '../../utils';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

export function deriveTokenTransferMessageAddress(
  programId: PublicKeyInitData,
  payer: PublicKeyInitData,
  sequence: BN,
): PublicKey {
  const sequenceBuf = Buffer.alloc(8);
  sequenceBuf.writeBigUInt64BE(BigInt(sequence.toString()));
  return deriveAddress(
    [Buffer.from('bridged'), new PublicKey(payer).toBuffer(), sequenceBuf],
    programId,
  );
}
