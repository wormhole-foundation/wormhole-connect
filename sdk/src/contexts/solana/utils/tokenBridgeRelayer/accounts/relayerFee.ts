import { ChainId } from 'types';
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { deriveAddress } from '../../utils';

export interface RelayerFee {
  chain: number;
  fee: BN;
}

export function deriveRelayerFeeAddress(
  programId: PublicKeyInitData,
  chainId: ChainId,
): PublicKey {
  const chainIdBuf = Buffer.alloc(2);
  chainIdBuf.writeUInt16LE(chainId);
  return deriveAddress([Buffer.from('relayer_fee'), chainIdBuf], programId);
}
