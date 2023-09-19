import { ParsedMessage, ParsedRelayerMessage } from 'utils/sdk';

export type RelayOptions = {
  relayerFee?: number;
  toNativeToken?: number;
  receiveNativeAmt: number;
};

export interface TransferDestInfoParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  receiveTx?: string;
  transferComplete?: boolean;
}
