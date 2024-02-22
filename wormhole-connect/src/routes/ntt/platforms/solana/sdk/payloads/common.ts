import { BN } from '@coral-xyz/anchor';

export class EndpointMessage<A> {
  static prefix: Buffer;
  sourceManager: Buffer;
  managerPayload: ManagerMessage<A>;

  constructor(sourceManager: Buffer, managerPayload: ManagerMessage<A>) {
    this.sourceManager = sourceManager;
    this.managerPayload = managerPayload;
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
    const managerPayloadLen = data.readUInt16BE(36);
    const managerPayload = deserializer(
      data.subarray(38, 38 + managerPayloadLen),
    );
    return new EndpointMessage(sourceManager, managerPayload);
  }

  static serialize<A>(
    msg: EndpointMessage<A>,
    serializer: (payload: ManagerMessage<A>) => Buffer,
  ): Buffer {
    const payload = serializer(msg.managerPayload);
    // assert(msg.sourceManager.length == 32, 'sourceManager must be 32 bytes');
    const buffer = Buffer.concat([
      this.prefix,
      msg.sourceManager,
      new BN(payload.length).toBuffer('be', 2),
      payload,
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
