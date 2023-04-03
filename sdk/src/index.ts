import TESTNET_CONFIG from './config/TESTNET';
import MAINNET_CONFIG from './config/MAINNET';

export * from './types';
export * from './config/MAINNET';
export { TESTNET_TO_MAINNET_CHAIN_NAMES } from './config/TESTNET';
export * from './wormhole';
export * from './contexts/solana';
export * from './contexts/eth';
export const CONFIG = {
  MAINNET: MAINNET_CONFIG,
  TESTNET: TESTNET_CONFIG,
};
