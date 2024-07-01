import { Transaction as SolanaTransaction } from '@solana/web3.js';

import { TransactionRequest as EvmTransactionRequest } from '@ethersproject/abstract-provider';
import { Deferrable } from '@ethersproject/properties';

// These types use sdkv2's Platform type for platform
export interface SignRequestEvm {
  platform: 'Evm';
  transaction: Deferrable<EvmTransactionRequest>;
}

export interface SignRequestSolana {
  platform: 'Solana';
  transaction: SolanaTransaction;
}

export type SignRequest = SignRequestEvm | SignRequestSolana;
