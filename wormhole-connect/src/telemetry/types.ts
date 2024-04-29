import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { Route } from 'config/types';
import { TransferWallet } from 'utils/wallet';

export interface LoadEvent {
  type: 'load';
}

export interface TransferDetails {
  route: Route;
  fromToken: TokenDetails;
  toToken: TokenDetails;
  fromChain: ChainName | ChainId;
  toChain: ChainName | ChainId;
}

export type TransferEventType =
  | 'transfer.initiate'
  | 'transfer.start'
  | 'transfer.success'
  | 'transfer.redeem.initiate'
  | 'transfer.redeem.start'
  | 'transfer.redeem.success';

export interface TransferEvent {
  type: TransferEventType;
  details: TransferDetails;
}

export interface TransferErrorEvent {
  type: 'transfer.error' | 'transfer.redeem.error';
  details: TransferDetails;
  error: TransferError;
}

export interface TransferError {
  type: TransferErrorType;
  original: any;
}

export interface TokenDetails {
  symbol: string;
  tokenId:
    | {
        address: string;
        chain: string;
      }
    | 'native';
}

export const ERR_INSUFFICIENT_ALLOWANCE = 'insufficient_allowance';
export const ERR_SWAP_FAILED = 'swap_failed';
// NTT errors
export const ERR_NOT_ENOUGH_CAPACITY = 'swap_failed';
export const ERR_SOURCE_CONTRACT_PAUSED = 'source_contract_paused';
export const ERR_DESTINATION_CONTRACT_PAUSED = 'destination_contract_paused';
export const ERR_UNSUPPORTED_ABI_VERSION = 'unsupported_abi_version';
export const ERR_INSUFFICIENT_GAS = 'insufficient_gas';

export const ERR_USER_REJECTED = 'user_rejected';
export const ERR_TIMEOUT = 'user_timeout';
export const ERR_UNKNOWN = 'unknown';

export type TransferErrorType =
  | typeof ERR_INSUFFICIENT_ALLOWANCE
  | typeof ERR_SWAP_FAILED
  | typeof ERR_NOT_ENOUGH_CAPACITY
  | typeof ERR_SOURCE_CONTRACT_PAUSED
  | typeof ERR_DESTINATION_CONTRACT_PAUSED
  | typeof ERR_UNSUPPORTED_ABI_VERSION
  | typeof ERR_INSUFFICIENT_GAS
  | typeof ERR_USER_REJECTED
  | typeof ERR_TIMEOUT
  | typeof ERR_UNKNOWN;

export interface ConnectWalletEvent {
  type: 'wallet.connect';
  details: {
    side: TransferWallet;
    chain: ChainName;
    wallet: string;
  };
}

export type WormholeConnectEvent =
  | LoadEvent
  | TransferEvent
  | TransferErrorEvent
  | ConnectWalletEvent;

export interface WormholeConnectEventMeta {
  meta: {
    version: string;
    host: string;
  };
}

export type WormholeConnectEventWithMeta = WormholeConnectEvent &
  WormholeConnectEventMeta;

export type WormholeConnectEventHandler = (type: WormholeConnectEvent) => void;
