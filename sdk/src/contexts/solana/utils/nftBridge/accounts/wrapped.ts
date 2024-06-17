import { tryNativeToUint8Array } from '@certusone/wormhole-sdk';
import { BN } from '@project-serum/anchor';
import {
  Connection,
  PublicKey,
  Commitment,
  PublicKeyInitData,
} from '@solana/web3.js';
import { deriveAddress, getAccountData } from '../../utils';
import { deriveWrappedMetaKey } from '../../tokenBridge';
import { ChainId } from '../../../../../types';
import { MAINNET_CHAINS } from '../../../../../config/MAINNET';
export { deriveWrappedMetaKey } from '../../tokenBridge';
export function deriveWrappedMintKey(
  tokenBridgeProgramId: PublicKeyInitData,
  tokenChain: number | ChainId,
  tokenAddress: Buffer | Uint8Array | string,
  tokenId: bigint | number,
): PublicKey {
  if (tokenChain == MAINNET_CHAINS.solana) {
    throw new Error(
      'tokenChain == CHAIN_ID_SOLANA does not have wrapped mint key',
    );
  }
  if (typeof tokenAddress == 'string') {
    tokenAddress = tryNativeToUint8Array(tokenAddress, tokenChain as ChainId);
  }
  return deriveAddress(
    [
      Buffer.from('wrapped'),
      (() => {
        const buf = Buffer.alloc(2);
        buf.writeUInt16BE(tokenChain as number);
        return buf;
      })(),
      tokenAddress,
      new BN(tokenId.toString()).toArrayLike(Buffer, 'be', 32),
    ],
    tokenBridgeProgramId,
  );
}
export class WrappedMeta {
  chain: number;
  tokenAddress: Buffer;
  tokenId: bigint;
  constructor(chain: number, tokenAddress: Buffer, tokenId: bigint) {
    this.chain = chain;
    this.tokenAddress = tokenAddress;
    this.tokenId = tokenId;
  }
  static deserialize(data: Buffer): WrappedMeta {
    if (data.length != 66) {
      throw new Error('data.length != 66');
    }
    const chain = data.readUInt16LE(0);
    const tokenAddress = data.subarray(2, 34);
    const tokenId = BigInt(
      new BN(data.subarray(34, 66), undefined, 'le').toString(),
    );
    return new WrappedMeta(chain, tokenAddress, tokenId);
  }
}
