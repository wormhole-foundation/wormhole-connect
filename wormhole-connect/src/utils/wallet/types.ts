import {
  Transaction as SolanaTransaction,
  Keypair as SolanaKeypair,
} from '@solana/web3.js';

import { TransactionRequest as EvmTransactionRequest } from 'ethers';

import { Types as AptosTypes } from 'aptos';

// These types use sdkv2's Platform type for platform
export interface SignRequestEvm {
  platform: 'Evm';
  transaction: EvmTransactionRequest;
}

export interface SignRequestSolana {
  platform: 'Solana';
  transaction: SolanaTransaction;
  signers: SolanaKeypair[];
}

export interface SignRequestCosmos {
  platform: 'Cosmwasm';
  // TODO using CosmosTransaction here would require importing all of
  // wallet-adapter-cosmos, which we don't want to do here because
  // it would bloat the bundle.
  transaction: any;
}

export interface SignRequestSui {
  platform: 'Sui';
  // TODO
  transaction: any;
}

export interface SignRequestSei {
  platform: 'Sei';
  // TODO
  transaction: any;
}

export interface SignRequestAptos {
  platform: 'Aptos';
  // TODO
  transaction: AptosTypes.EntryFunctionPayload;
}

export type SignRequest =
  | SignRequestEvm
  | SignRequestSolana
  | SignRequestCosmos
  | SignRequestSui
  | SignRequestAptos;
