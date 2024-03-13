import { TrimmedAmount } from './trimmedAmount';

export class NativeTokenTransfer {
  static prefix = Buffer.from([0x99, 0x4e, 0x54, 0x54]);
  trimmedAmount: TrimmedAmount;
  sourceToken: Buffer;
  recipientAddress: Buffer;
  recipientChain: number;

  constructor(
    sourceToken: Buffer,
    amount: TrimmedAmount,
    recipientChain: number,
    recipientAddress: Buffer,
  ) {
    this.trimmedAmount = amount;
    this.sourceToken = sourceToken;
    this.recipientAddress = recipientAddress;
    this.recipientChain = recipientChain;
  }

  static deserialize = (data: Buffer): NativeTokenTransfer => {
    const prefix = data.subarray(0, 4);
    if (!prefix.equals(NativeTokenTransfer.prefix)) {
      throw new Error('Invalid prefix');
    }
    const amount = TrimmedAmount.deserialize(data.subarray(4, 13));
    const sourceToken = data.subarray(13, 45);
    const recipientAddress = data.subarray(45, 77);
    const recipientChain = data.readUInt16BE(77);
    return new NativeTokenTransfer(
      sourceToken,
      amount,
      recipientChain,
      recipientAddress,
    );
  };

  static serialize = (msg: NativeTokenTransfer): Buffer => {
    const buffer = Buffer.concat([
      NativeTokenTransfer.prefix,
      TrimmedAmount.serialize(msg.trimmedAmount),
      msg.sourceToken,
      msg.recipientAddress,
    ]);
    const recipientChain = Buffer.alloc(2);
    recipientChain.writeUInt16BE(msg.recipientChain, 0);
    return Buffer.concat([buffer, recipientChain]);
  };
}
