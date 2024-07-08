import { TokenPrices } from 'store/tokenPrices';
import { ParsedMessage } from 'utils/sdk';

export type RelayOptions = {
  relayerFee?: number;
  toNativeToken?: number;
  receiveNativeAmt: number;
};

export interface TransferDestInfoParams {
  txData: ParsedMessage;
  tokenPrices: TokenPrices;
  receiveTx?: string;
  transferComplete?: boolean;
}
