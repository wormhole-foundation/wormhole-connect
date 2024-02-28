import { BN } from '@coral-xyz/anchor';

export class TransceiverMessage<A> {
  static prefix: Buffer;
  sourceNttManager: Buffer;
  recipientNttManager: Buffer;
  nttManagerPayload: NttManagerMessage<A>;
  transceiverPayload: Buffer;

  constructor(
    sourceNttManager: Buffer,
    recipientNttManager: Buffer,
    ntt_managerPayload: NttManagerMessage<A>,
    transceiverPayload: Buffer,
  ) {
    this.sourceNttManager = sourceNttManager;
    this.recipientNttManager = recipientNttManager;
    this.nttManagerPayload = ntt_managerPayload;
    this.transceiverPayload = transceiverPayload;
  }

  static deserialize<A>(
    data: Buffer,
    deserializer: (data: Buffer) => NttManagerMessage<A>,
  ): TransceiverMessage<A> {
    if (this.prefix == undefined) {
      throw new Error('Unknown prefix.');
    }
    const prefix = data.subarray(0, 4);
    if (!prefix.equals(this.prefix)) {
      throw new Error('Invalid prefix');
    }
    const sourceNttManager = data.subarray(4, 36);
    const recipientNttManager = data.subarray(36, 68);
    const ntt_managerPayloadLen = data.readUInt16BE(68);
    const ntt_managerPayload = deserializer(
      data.subarray(70, 70 + ntt_managerPayloadLen),
    );
    const transceiverPayloadLen = data.readUInt16BE(70 + ntt_managerPayloadLen);
    const transceiverPayload = data.subarray(
      72 + ntt_managerPayloadLen,
      72 + ntt_managerPayloadLen + transceiverPayloadLen,
    );
    return new TransceiverMessage(
      sourceNttManager,
      recipientNttManager,
      ntt_managerPayload,
      transceiverPayload,
    );
  }

  static serialize<A>(
    msg: TransceiverMessage<A>,
    serializer: (payload: NttManagerMessage<A>) => Buffer,
  ): Buffer {
    const payload = serializer(msg.nttManagerPayload);
    const payloadLen = new BN(payload.length).toBuffer('be', 2);
    const transceiverPayloadLen = new BN(
      msg.transceiverPayload.length,
    ).toBuffer('be', 2);
    const buffer = Buffer.concat([
      this.prefix,
      msg.sourceNttManager,
      msg.recipientNttManager,
      payloadLen,
      payload,
      transceiverPayloadLen,
      msg.transceiverPayload,
    ]);
    return buffer;
  }
}

export class NttManagerMessage<A> {
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
  ): NttManagerMessage<A> => {
    const sequence = data.readBigUInt64BE(0);
    const sender = data.subarray(8, 40);
    const payloadLen = data.readUint16BE(40);
    const payload = deserializer(data.subarray(42, 42 + payloadLen));
    return new NttManagerMessage(sequence, sender, payload);
  };

  static serialize = <A>(
    msg: NttManagerMessage<A>,
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
