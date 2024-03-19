import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { keccak256 } from 'ethers/lib/utils';
import { NttManagerMessage } from './payloads/common';
import { NativeTokenTransfer } from './payloads/transfers';
import { WormholeTransceiverMessage } from './payloads/wormhole';
import config from 'config';

export const getNttManagerMessageDigest = (
  emitterChain: ChainName | ChainId,
  message: NttManagerMessage<NativeTokenTransfer>,
): string => {
  const chainIdBuffer = Buffer.alloc(2);
  chainIdBuffer.writeUInt16BE(config.wh.toChainId(emitterChain));
  const serialized = NttManagerMessage.serialize(
    message,
    NativeTokenTransfer.serialize,
  );
  const digest = keccak256(Buffer.concat([chainIdBuffer, serialized]));
  return digest;
};

export const parseWormholeTransceiverMessage = (
  message: string | Buffer,
): WormholeTransceiverMessage<NativeTokenTransfer> => {
  const buffer = Buffer.isBuffer(message)
    ? message
    : Buffer.from(message.slice(2), 'hex');
  return WormholeTransceiverMessage.deserialize(buffer, (a) =>
    NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
  );
};

export interface WormholeTransceiverInstruction {
  shouldSkipRelayerSend: boolean;
}

export const encodeWormholeTransceiverInstruction = (
  instruction: WormholeTransceiverInstruction,
): Buffer => {
  const buffer = Buffer.alloc(1);
  buffer.writeUInt8(instruction.shouldSkipRelayerSend ? 1 : 0);
  return buffer;
};

export interface TransceiverInstruction {
  index: number;
  payload: Buffer;
}

export const encodeTransceiverInstruction = (
  instruction: TransceiverInstruction,
): Buffer => {
  if (instruction.payload.length > 255) {
    throw new Error(`PayloadTooLong: ${instruction.payload.length}`);
  }
  const payloadLength = Buffer.from([instruction.payload.length]);
  const indexBuffer = Buffer.from([instruction.index]);
  return Buffer.concat([indexBuffer, payloadLength, instruction.payload]);
};

export const encodeTransceiverInstructions = (
  instructions: TransceiverInstruction[],
): Buffer => {
  if (instructions.length > 255) {
    throw new Error(`PayloadTooLong: ${instructions.length}`);
  }

  const instructionsLength = Buffer.from([instructions.length]);
  let encoded = Buffer.alloc(0);

  for (let i = 0; i < instructions.length; i++) {
    const innerEncoded = encodeTransceiverInstruction(instructions[i]);
    encoded = Buffer.concat([encoded, innerEncoded]);
  }

  return Buffer.concat([instructionsLength, encoded]);
};
