import {
  EndpointMessage,
  ManagerMessage,
  NativeTokenTransferMessage,
} from './types';

export const WH_ENDPOINT_PAYLOAD_PREFIX = Buffer.from('9945ff10', 'hex');
export const NTT_PREFIX = Buffer.from('994e5454', 'hex');

export const parseEndpointMessage = (encoded: Buffer): EndpointMessage => {
  let offset = 0;

  const prefix = encoded.slice(offset, offset + 4);
  if (prefix.compare(WH_ENDPOINT_PAYLOAD_PREFIX) !== 0) {
    throw new Error('Invalid prefix');
  }
  offset += 4;

  const sourceManagerAddress = encoded.slice(offset, offset + 32);
  offset += 32;

  const managerPayloadLength = encoded.readUInt16BE(offset);
  offset += 2;

  const managerPayload = encoded.slice(offset, offset + managerPayloadLength);
  offset += managerPayloadLength;

  if (offset !== encoded.length) {
    throw new Error('Invalid encoded EndpointMessage buffer length');
  }

  return {
    sourceManagerAddress,
    managerPayload,
  };
};

export const parseManagerMessage = (encoded: Buffer): ManagerMessage => {
  let offset = 0;

  const sequence = encoded.readBigUInt64BE(offset);
  offset += 8;

  const sender = encoded.slice(offset, offset + 32);
  offset += 32;

  const payloadLength = encoded.readUInt16BE(offset);
  offset += 2;

  const payload = encoded.slice(offset, offset + payloadLength);
  offset += payloadLength;

  if (offset !== encoded.length) {
    throw new Error('Invalid encoded ManagerMessage buffer length');
  }

  return {
    sequence,
    sender,
    payload,
  };
};

export const parseNativeTokenTransfer = (
  encoded: Buffer,
): NativeTokenTransferMessage => {
  let offset = 0;

  const prefix = encoded.slice(offset, offset + 4);
  if (prefix.compare(NTT_PREFIX) !== 0) {
    throw new Error('Invalid prefix');
  }
  offset += 4;

  const decimals = encoded.readUInt8(offset);
  offset += 1;

  const amount = BigInt(
    '0x' + encoded.slice(offset, offset + 8).toString('hex'),
  );
  offset += 8;

  const sourceToken = encoded.slice(offset, offset + 32);
  offset += 32;

  const to = encoded.slice(offset, offset + 32);
  offset += 32;

  const toChain = encoded.readUInt16BE(offset);
  offset += 2;

  if (offset !== encoded.length) {
    throw new Error('Invalid encoded NativeTokenTransfer buffer length');
  }

  return {
    decimals,
    amount,
    sourceToken,
    to,
    toChain,
  };
};
