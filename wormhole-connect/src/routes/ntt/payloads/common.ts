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
    nttManagerPayload: NttManagerMessage<A>,
    transceiverPayload: Buffer,
  ) {
    this.sourceNttManager = sourceNttManager;
    this.recipientNttManager = recipientNttManager;
    this.nttManagerPayload = nttManagerPayload;
    this.transceiverPayload = transceiverPayload;
  }

  static deserialize<A>(
    data: Buffer,
    deserializer: (data: Buffer) => NttManagerMessage<A>,
  ): TransceiverMessage<A> {
    if (this.prefix === undefined) {
      throw new Error('Unknown prefix.');
    }
    const prefix = data.subarray(0, 4);
    if (!prefix.equals(this.prefix)) {
      throw new Error('Invalid prefix');
    }
    const sourceNttManager = data.subarray(4, 36);
    const recipientNttManager = data.subarray(36, 68);
    const nttManagerPayloadLen = data.readUInt16BE(68);
    const nttManagerPayload = deserializer(
      data.subarray(70, 70 + nttManagerPayloadLen),
    );
    const transceiverPayloadLen = data.readUInt16BE(70 + nttManagerPayloadLen);
    const transceiverPayload = data.subarray(
      72 + nttManagerPayloadLen,
      72 + nttManagerPayloadLen + transceiverPayloadLen,
    );
    return new TransceiverMessage(
      sourceNttManager,
      recipientNttManager,
      nttManagerPayload,
      transceiverPayload,
    );
  }

  static serialize<A>(
    msg: TransceiverMessage<A>,
    serializer: (payload: NttManagerMessage<A>) => Buffer,
  ): Buffer {
    const payload = serializer(msg.nttManagerPayload);
    if (msg.sourceNttManager.length !== 32) {
      throw new Error('sourceNttManager must be 32 bytes');
    }
    if (msg.recipientNttManager.length !== 32) {
      throw new Error('recipientNttManager must be 32 bytes');
    }
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
  id: Buffer;
  sender: Buffer;
  payload: A;

  constructor(id: Buffer, sender: Buffer, payload: A) {
    if (id.length !== 32) {
      throw new Error('id must be 32 bytes');
    }
    if (sender.length !== 32) {
      throw new Error('sender must be 32 bytes');
    }
    this.id = id;
    this.sender = sender;
    this.payload = payload;
  }

  static deserialize = <A>(
    data: Buffer,
    deserializer: (data: Buffer) => A,
  ): NttManagerMessage<A> => {
    const id = data.subarray(0, 32);
    const sender = data.subarray(32, 64);
    const payloadLen = data.readUint16BE(64);
    const payload = deserializer(data.subarray(66, 66 + payloadLen));
    return new NttManagerMessage(id, sender, payload);
  };

  static serialize = <A>(
    msg: NttManagerMessage<A>,
    serializer: (payload: A) => Buffer,
  ): Buffer => {
    const payload = serializer(msg.payload);
    return Buffer.concat([
      msg.id,
      msg.sender,
      new BN(payload.length).toBuffer('be', 2),
      payload,
    ]);
  };
}
