import TESTNET_CONFIG from './config/TESTNET';
import MAINNET_CONFIG from './config/MAINNET';

export type {
  TestnetChainId,
  TestnetChainName,
  ChainContracts as TestnetChainContracts,
} from './config/TESTNET';

export * from './types';
export * from './vaa';
export * from './config/MAINNET';
export * from './wormhole';
export * from './contexts/solana/context';
export * from './contexts/eth/context';
export * from './contexts/sui/context';
export * from './contexts/aptos/context';
export * from './contexts/sei/context';
export const CONFIG = {
  MAINNET: MAINNET_CONFIG,
  TESTNET: TESTNET_CONFIG,
};
