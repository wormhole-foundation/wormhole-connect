import { ChainId } from 'types';
import { deriveAddress } from '../../utils';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

export interface ForeignContract {
  chain: number;
  address: number[];
  fee: BN;
}

export function deriveForeignContractAddress(
  programId: PublicKeyInitData,
  chainId: ChainId,
): PublicKey {
  const chainIdBuf = Buffer.alloc(2);
  chainIdBuf.writeUInt16BE(chainId);
  return deriveAddress(
    [Buffer.from('foreign_contract'), chainIdBuf],
    programId,
  );
}
