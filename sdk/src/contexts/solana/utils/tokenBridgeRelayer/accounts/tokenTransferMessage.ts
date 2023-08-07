import { deriveAddress } from '../../utils';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';

export function deriveTokenTransferMessageAddress(
  programId: PublicKeyInitData,
  sequence: bigint,
): PublicKey {
  const sequenceBuf = Buffer.alloc(8);
  sequenceBuf.writeBigUInt64LE(sequence);
  return deriveAddress([Buffer.from('bridged'), sequenceBuf], programId);
}
