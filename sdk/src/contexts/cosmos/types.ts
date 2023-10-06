import { EncodeObject } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/stargate';

export interface CosmosTransaction {
  fee: StdFee | 'auto' | number;
  msgs: EncodeObject[];
  memo: string;
}

export interface WrappedRegistryResponse {
  address: string;
}
