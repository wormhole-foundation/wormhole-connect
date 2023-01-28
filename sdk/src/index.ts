import TESTNET_CONFIG from './config/TESTNET';
import MAINNET_CONFIG from './config/MAINNET';

export * from './types';
export * from './config/MAINNET';
export * from './wormhole';
export const CONFIG = {
  MAINNET: MAINNET_CONFIG,
  TESTNET: TESTNET_CONFIG,
}
