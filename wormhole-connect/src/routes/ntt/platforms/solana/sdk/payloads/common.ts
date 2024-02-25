import { BN } from '@coral-xyz/anchor';

export class EndpointMessage<A> {
  static prefix: Buffer;
  sourceManager: Buffer;
  recipientManager: Buffer;
  managerPayload: ManagerMessage<A>;
  endpointPayload: Buffer;

  constructor(
    sourceManager: Buffer,
    recipientManager: Buffer,
    managerPayload: ManagerMessage<A>,
    endpointPayload: Buffer,
  ) {
    this.sourceManager = sourceManager;
    this.recipientManager = recipientManager;
    this.managerPayload = managerPayload;
    this.endpointPayload = endpointPayload;
  }

  static deserialize<A>(
    data: Buffer,
    deserializer: (data: Buffer) => ManagerMessage<A>,
  ): EndpointMessage<A> {
    if (this.prefix == undefined) {
      throw new Error('Unknown prefix.');
    }
    const prefix = data.subarray(0, 4);
    if (!prefix.equals(this.prefix)) {
      throw new Error('Invalid prefix');
    }
    const sourceManager = data.subarray(4, 36);
    const recipientManager = data.subarray(36, 68);
    const managerPayloadLen = data.readUInt16BE(68);
    const managerPayload = deserializer(
      data.subarray(70, 70 + managerPayloadLen),
    );
    const endpointPayloadLen = data.readUInt16BE(70 + managerPayloadLen);
    const endpointPayload = data.subarray(
      72 + managerPayloadLen,
      72 + managerPayloadLen + endpointPayloadLen,
    );
    return new EndpointMessage(
      sourceManager,
      recipientManager,
      managerPayload,
      endpointPayload,
    );
  }

  static serialize<A>(
    msg: EndpointMessage<A>,
    serializer: (payload: ManagerMessage<A>) => Buffer,
  ): Buffer {
    const payload = serializer(msg.managerPayload);
    const payloadLen = new BN(payload.length).toBuffer('be', 2);
    const endpointPayloadLen = new BN(msg.endpointPayload.length).toBuffer(
      'be',
      2,
    );
    const buffer = Buffer.concat([
      this.prefix,
      msg.sourceManager,
      msg.recipientManager,
      payloadLen,
      payload,
      endpointPayloadLen,
      msg.endpointPayload,
    ]);
    return buffer;
  }
}

export class ManagerMessage<A> {
  sequence: bigint;
  sender: Buffer;
  payload: A;

  constructor(sequence: bigint, sender: Buffer, payload: A) {
    this.sequence = sequence;
    this.sender = sender;
    this.payload = payload;
  }

  static deserialize = <A>(
    data: Buffer,
    deserializer: (data: Buffer) => A,
  ): ManagerMessage<A> => {
    const sequence = data.readBigUInt64BE(0);
    const sender = data.subarray(8, 40);
    const payloadLen = data.readUint16BE(40);
    const payload = deserializer(data.subarray(42, 42 + payloadLen));
    return new ManagerMessage(sequence, sender, payload);
  };

  static serialize = <A>(
    msg: ManagerMessage<A>,
    serializer: (payload: A) => Buffer,
  ): Buffer => {
    const buffer = Buffer.alloc(40);
    buffer.writeBigUInt64BE(msg.sequence, 0);
    buffer.set(msg.sender, 8);
    const payload = serializer(msg.payload);
    return Buffer.concat([
      buffer,
      new BN(payload.length).toBuffer('be', 2),
      payload,
    ]);
  };
}
