import { ManagerMessage, NativeTokenTransfer } from './platforms/solana/sdk';
import { wh } from 'utils/sdk';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { keccak256 } from 'ethers/lib/utils';

export const getNTTManagerMessageDigest = (
  emitterChain: ChainName | ChainId,
  managerMessage: ManagerMessage<NativeTokenTransfer>,
): string => {
  const chainIdBuffer = Buffer.alloc(2);
  chainIdBuffer.writeUInt16BE(wh.toChainId(emitterChain));
  const serialized = ManagerMessage.serialize(
    managerMessage,
    NativeTokenTransfer.serialize,
  );
  const digest = keccak256(Buffer.concat([chainIdBuffer, serialized]));
  return digest;
};
