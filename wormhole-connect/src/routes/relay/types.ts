import { TokenPrices } from 'store/tokenPrices';
import { ParsedMessage, ParsedRelayerMessage } from 'utils/sdk';

export type RelayOptions = {
  relayerFee?: number;
  toNativeToken?: number;
  receiveNativeAmt: number;
};

export interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  tokenPrices: TokenPrices;
  receiveTx?: string;
  transferComplete?: boolean;
}
