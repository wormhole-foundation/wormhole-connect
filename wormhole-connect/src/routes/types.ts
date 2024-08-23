import { TransferInfo } from '../utils/sdkv2';
import { TokenPrices } from 'store/tokenPrices';
import { TokenId } from 'sdklegacy';

export interface TransferInfoBaseParams {
  txData: TransferInfo;
  tokenPrices: TokenPrices;
}

export interface TransferDestInfoBaseParams {
  txData: TransferInfo;
  tokenPrices: TokenPrices;
  receiveTx?: string;
  gasEstimate?: string;
}

export type Row = {
  title: string;
  value: string;
  valueUSD?: string;
};

export interface NestedRow extends Row {
  rows?: Row[];
}

export type TransferDestInfo = {
  route: string;
  displayData: TransferDisplayData;
};

export type TransferDisplayData = NestedRow[];

export interface RelayerFee {
  fee: bigint;
  feeToken: TokenId | 'native';
}
