import { NetworkData } from 'config/types';
import { MAINNET_CHAINS } from './chains';
import { MAINNET_TOKENS } from './tokens';
import { MAINNET_GAS_ESTIMATES } from './gasEstimates';
import { MAINNET_RPC_MAPPING, MAINNET_REST_MAPPING } from './rpcs';

export * from './chains';
export * from './rpcs';
export * from './tokens';
export * from './gasEstimates';

const MAINNET: NetworkData = {
  chains: MAINNET_CHAINS,
  tokens: MAINNET_TOKENS,
  gasEstimates: MAINNET_GAS_ESTIMATES,
  rpc: MAINNET_RPC_MAPPING,
  rest: MAINNET_REST_MAPPING,
};

export default MAINNET;
