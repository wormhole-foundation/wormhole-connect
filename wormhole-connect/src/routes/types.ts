import { Route } from 'config/types';
import { ParsedMessage, ParsedRelayerMessage } from '../utils/sdk';
import { TokenPrices } from 'store/tokenPrices';
import { BigNumber } from 'ethers5';
import { TokenId } from 'sdklegacy';

export type TokenTransferMessage = ParsedMessage;
export type RelayTransferMessage = ParsedRelayerMessage;
export interface CCTPMessage {
  message: string;
}
export type ManualCCTPMessage = CCTPMessage & ParsedMessage;
export type RelayCCTPMessage = CCTPMessage & ParsedRelayerMessage;
export type UnsignedCCTPMessage = ManualCCTPMessage | RelayCCTPMessage;
export type TBTCMessage = TokenTransferMessage & { to: string };
export enum NttRelayingType {
  Standard,
  Special,
  Manual,
}
export type UnsignedNttMessage = ParsedMessage & {
  recipientNttManager: string;
  messageDigest: string;
  relayerFee: string;
  relayingType: NttRelayingType;
};
export type UnsignedMessage =
  | TokenTransferMessage
  | RelayTransferMessage
  | UnsignedCCTPMessage
  | TBTCMessage
  | UnsignedNttMessage;

export const isUnsignedNttMessage = (
  message: UnsignedMessage,
): message is UnsignedNttMessage =>
  typeof message === 'object' &&
  'recipientNttManager' in message &&
  'messageDigest' in message &&
  'relayerFee' in message &&
  'relayingType' in message;

export type SignedTokenTransferMessage = TokenTransferMessage & { vaa: string }; // hex encoded vaa bytes
export type SignedRelayTransferMessage = RelayTransferMessage & { vaa: string }; // hex encoded vaa bytes
export type SignedNttMessage = UnsignedNttMessage & {
  vaa: string;
}; // hex encoded vaa bytes
export type SignedWormholeMessage =
  | SignedTokenTransferMessage
  | SignedRelayTransferMessage
  | SignedNttMessage;
export type SignedManualCCTPMessage = ManualCCTPMessage & {
  attestation: string;
};
export type SignedRelayCCTPMessage = RelayCCTPMessage & { attestation: string };
export type SignedCCTPMessage =
  | SignedManualCCTPMessage
  | SignedRelayCCTPMessage;
export type SignedMessage = SignedWormholeMessage | SignedCCTPMessage;

export const isSignedWormholeMessage = (
  message: SignedMessage,
): message is SignedWormholeMessage =>
  typeof message === 'object' && 'vaa' in message;
export const isSignedCCTPMessage = (
  message: SignedMessage,
): message is SignedCCTPMessage =>
  typeof message === 'object' &&
  'message' in message &&
  'attestation' in message;
export const isSignedNttMessage = (
  message: SignedMessage,
): message is SignedNttMessage =>
  isSignedWormholeMessage(message) && isUnsignedNttMessage(message);

export interface TransferInfoBaseParams {
  txData: ParsedMessage | ParsedRelayerMessage;
  tokenPrices: TokenPrices;
}

export interface TransferDestInfoBaseParams {
  txData: ParsedMessage | ParsedRelayerMessage;
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
  route: Route;
  displayData: TransferDisplayData;
};

export type TransferDisplayData = NestedRow[];

export interface RelayerFee {
  fee: BigNumber;
  feeToken: TokenId | 'native';
}
