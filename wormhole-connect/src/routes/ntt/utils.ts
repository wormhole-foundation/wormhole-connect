import { keccak256 } from 'js-sha3'; // Ensure you have this package installed
import { ManagerMessage, NativeTokenTransfer } from './platforms/solana/sdk';
import { wh } from 'utils/sdk';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

export const getNTTManagerMessageDigest = (
  emitterChain: ChainName | ChainId,
  managerMessage: ManagerMessage<NativeTokenTransfer>,
): string => {
  const serialized = ManagerMessage.serialize(
    managerMessage,
    NativeTokenTransfer.serialize,
  );
  const chainIdBuffer = Buffer.alloc(2);
  chainIdBuffer.writeUInt16BE(wh.toChainId(emitterChain));
  const digest = keccak256(Buffer.concat([chainIdBuffer, serialized]));
  return digest;
};
