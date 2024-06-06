import {
  Connection,
  PublicKey,
  Commitment,
  PublicKeyInitData,
} from '@solana/web3.js';
import { getAccountData } from '../../utils';

export async function getSignatureSetData(
  connection: Connection,
  signatureSet: PublicKeyInitData,
  commitment?: Commitment,
): Promise<SignatureSetData | null> {
  const account = await connection.getAccountInfo(
    new PublicKey(signatureSet),
    commitment,
  );
  const accountData = getAccountData(account);
  return SignatureSetData.deserialize(accountData);
}

export class SignatureSetData {
  signatures: boolean[];
  hash: Buffer;
  guardianSetIndex: number;
  // This is the type discriminator for the signature set.
  // TODO: Determine if this is derived from some human readable string and use that here.
  private static typeDiscriminator = Buffer.from('EdT2crefQfY=', 'base64');

  constructor(signatures: boolean[], hash: Buffer, guardianSetIndex: number) {
    this.signatures = signatures;
    this.hash = hash;
    this.guardianSetIndex = guardianSetIndex;
  }

  static deserialize(data: Buffer): SignatureSetData {
    console.log('data', data);
    let offset = 0;
    if (SignatureSetData.typeDiscriminator.compare(data, 0, 8) === 0) {
      offset += 8;
    }
    const numSignatures = data.readUInt32LE(offset);
    offset += 4;
    const signatures = [...data.subarray(offset, offset + numSignatures)].map(
      (x) => x != 0,
    );
    const hashIndex = 4 + numSignatures;
    const hash = data.subarray(hashIndex, hashIndex + 32);
    console.log('hashIndex', hashIndex);
    const guardianSetIndex = data.readUInt32LE(hashIndex + 32);
    return new SignatureSetData(signatures, hash, guardianSetIndex);
  }
}
