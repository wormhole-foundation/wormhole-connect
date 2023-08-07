import { ChainId } from 'types';
import { deriveAddress } from '../../utils';
import { PublicKeyInitData } from '@solana/web3.js';

export interface ForeignEmitter {
  chain: ChainId;
  address: Buffer;
}

export function deriveForeignContractAddress(
  programId: PublicKeyInitData,
  chainId: ChainId,
) {
  const chainIdBuf = Buffer.alloc(2);
  chainIdBuf.writeUInt16LE(chainId);
  return deriveAddress(
    [Buffer.from('foreign_contract'), chainIdBuf],
    programId,
  );
}
