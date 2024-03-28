import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Route } from 'config/types';

export interface TransferDetails {
  route: Route;
  token: TokenId | 'native';
  fromChain: ChainName | ChainId;
  toChain: ChainName | ChainId;
}

export interface TransferStart {
  event: 'transferStart';
  details: TransferDetails;
}

export interface TransferSuccess {
  event: 'transferSucess';
  details: TransferDetails;
}

export type TransferErrorType =
  | 'insufficient_allowance'
  | 'swap_error'
  | 'user_rejected'
  | 'timeout';

export interface TransferError {
  event: 'transferError';
  error: TransferErrorType;
  details: TransferDetails;
}

export type WormholeConnectEvent =
  | TransferStart
  | TransferSuccess
  | TransferError;

export type WormholeConnectEventHandler = (event: WormholeConnectEvent) => void;
