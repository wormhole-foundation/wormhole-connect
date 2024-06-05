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

// Checks for compatibility between the NTT Manager version in use on chain,
// and the ABI version Connect has. Major version must match, minor version on chain
// should be gte Connect's ABI version.
//
// For example, if the contract is using 1.1.0, we would use 1.0.0 but not 1.2.0.
export const abiVersionMatches = (
  targetVersion: string,
  abiVersion: string,
): boolean => {
  let [majorTarget, minorTarget] = targetVersion
    .split('.')
    .map((n) => parseInt(n, 10));
  let [majorAbi, minorAbi] = abiVersion.split('.').map((n) => parseInt(n, 10));
  return majorTarget == majorAbi && minorTarget >= minorAbi;
};
