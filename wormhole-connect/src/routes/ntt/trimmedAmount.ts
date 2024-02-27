export class TrimmedAmount {
  amount: bigint;
  decimals: number;

  constructor(amount: bigint, decimals: number) {
    this.amount = amount;
    this.decimals = decimals;
  }

  static deserialize(data: Buffer): TrimmedAmount {
    const decimals = data.readUInt8(0);
    const amount = data.readBigUInt64BE(1);
    return new TrimmedAmount(amount, decimals);
  }

  static serialize(amount: TrimmedAmount): Buffer {
    const buffer = Buffer.alloc(9);
    buffer.writeUInt8(amount.decimals, 0);
    buffer.writeBigUInt64BE(amount.amount, 1);
    return buffer;
  }
}
