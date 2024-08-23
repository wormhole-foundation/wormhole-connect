import { TokenPrices } from 'store/tokenPrices';
import { TransferInfo } from 'utils/sdkv2';

export type RelayOptions = {
  relayerFee?: number;
  toNativeToken?: number;
  receiveNativeAmt: number;
};

export interface TransferDestInfoParams {
  txData: TransferInfo;
  tokenPrices: TokenPrices;
  receiveTx?: string;
  transferComplete?: boolean;
}
