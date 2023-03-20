import { tryNativeToUint8Array } from '@certusone/wormhole-sdk';
import {
  Connection,
  PublicKey,
  Commitment,
  PublicKeyInitData,
} from '@solana/web3.js';
import { ChainId } from '../../../../../types';
import { MAINNET_CHAINS } from '../../../../../config/MAINNET';
import { deriveAddress, getAccountData } from '../../utils';

export { deriveSplTokenMetadataKey } from '../../utils/splMetadata';

export function deriveWrappedMintKey(
  tokenBridgeProgramId: PublicKeyInitData,
  tokenChain: number | ChainId,
  tokenAddress: Buffer | Uint8Array | string,
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
      tokenAddress as Uint8Array,
    ],
    tokenBridgeProgramId,
  );
}

export function deriveWrappedMetaKey(
  tokenBridgeProgramId: PublicKeyInitData,
  mint: PublicKeyInitData,
): PublicKey {
  return deriveAddress(
    [Buffer.from('meta'), new PublicKey(mint).toBuffer()],
    tokenBridgeProgramId,
  );
}

export async function getWrappedMeta(
  connection: Connection,
  tokenBridgeProgramId: PublicKeyInitData,
  mint: PublicKeyInitData,
  commitment?: Commitment,
): Promise<WrappedMeta> {
  return connection
    .getAccountInfo(
      deriveWrappedMetaKey(tokenBridgeProgramId, mint),
      commitment,
    )
    .then((info) => WrappedMeta.deserialize(getAccountData(info)));
}

export class WrappedMeta {
  chain: number;
  tokenAddress: Buffer;
  originalDecimals: number;

  constructor(chain: number, tokenAddress: Buffer, originalDecimals: number) {
    this.chain = chain;
    this.tokenAddress = tokenAddress;
    this.originalDecimals = originalDecimals;
  }

  static deserialize(data: Buffer): WrappedMeta {
    if (data.length != 35) {
      throw new Error('data.length != 35');
    }
    const chain = data.readUInt16LE(0);
    const tokenAddress = data.subarray(2, 34);
    const originalDecimals = data.readUInt8(34);
    return new WrappedMeta(chain, tokenAddress, originalDecimals);
  }
}
