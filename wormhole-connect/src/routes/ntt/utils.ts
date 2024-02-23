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

export interface WormholeEndpointInstruction {
  shouldSkipRelayerSend: boolean;
}

export const encodeWormholeEndpointInstruction = (
  instruction: WormholeEndpointInstruction,
): Buffer => {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(instruction.shouldSkipRelayerSend ? 1 : 0);
  return buffer;
};

export interface EndpointInstruction {
  index: number;
  payload: Buffer;
}

export const encodeEndpointInstruction = (
  instruction: EndpointInstruction,
): Buffer => {
  if (instruction.payload.length > 255) {
    throw new Error(`PayloadTooLong: ${instruction.payload.length}`);
  }
  const payloadLength = Buffer.from([instruction.payload.length]);
  const indexBuffer = Buffer.from([instruction.index]);
  return Buffer.concat([indexBuffer, payloadLength, instruction.payload]);
};

export const encodeEndpointInstructions = (
  instructions: EndpointInstruction[],
): Buffer => {
  if (instructions.length > 255) {
    throw new Error(`PayloadTooLong: ${instructions.length}`);
  }

  const instructionsLength = Buffer.from([instructions.length]);
  let encoded = Buffer.alloc(0);

  for (let i = 0; i < instructions.length; i++) {
    const innerEncoded = encodeEndpointInstruction(instructions[i]);
    encoded = Buffer.concat([encoded, innerEncoded]);
  }

  return Buffer.concat([instructionsLength, encoded]);
};
