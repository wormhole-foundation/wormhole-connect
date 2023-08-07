import TESTNET_CONFIG from './config/TESTNET';
import MAINNET_CONFIG from './config/MAINNET';
import DEVNET_CONFIG from './config/DEVNET';

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
export * from './contexts/sui';
export * from './contexts/aptos';
export * from './contexts/sei';
export const CONFIG = {
  MAINNET: MAINNET_CONFIG,
  TESTNET: TESTNET_CONFIG,
  DEVNET: DEVNET_CONFIG,
};
