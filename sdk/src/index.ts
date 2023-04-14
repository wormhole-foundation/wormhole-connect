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
export * from './contexts/solana';
export * from './contexts/eth';
export const CONFIG = {
  MAINNET: MAINNET_CONFIG,
  TESTNET: TESTNET_CONFIG,
};
