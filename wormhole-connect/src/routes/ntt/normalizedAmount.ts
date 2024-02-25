export class NormalizedAmount {
  amount: bigint;
  decimals: number;

  constructor(amount: bigint, decimals: number) {
    this.amount = amount;
    this.decimals = decimals;
  }

  static deserialize(data: Buffer): NormalizedAmount {
    const decimals = data.readUInt8(0);
    const amount = data.readBigUInt64BE(1);
    return new NormalizedAmount(amount, decimals);
  }

  static serialize(amount: NormalizedAmount): Buffer {
    const buffer = Buffer.alloc(9);
    buffer.writeUInt8(amount.decimals, 0);
    buffer.writeBigUInt64BE(amount.amount, 1);
    return buffer;
  }
}
