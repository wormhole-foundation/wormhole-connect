import { NetworkData } from 'config/types';
import { DEVNET_CHAINS } from './chains';
import { DEVNET_TOKENS } from './tokens';
import { DEVNET_GAS_ESTIMATES } from './gasEstimates';
import { DEVNET_RPC_MAPPING, DEVNET_REST_MAPPING } from './rpcs';

export * from './chains';
export * from './rpcs';
export * from './tokens';
export * from './gasEstimates';

const DEVNET: NetworkData = {
  chains: DEVNET_CHAINS,
  tokens: DEVNET_TOKENS,
  gasEstimates: DEVNET_GAS_ESTIMATES,
  rpc: DEVNET_RPC_MAPPING,
  rest: DEVNET_REST_MAPPING,
};

export default DEVNET;
