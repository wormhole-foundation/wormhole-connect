import { NetworkData } from 'config/types';
import { TESTNET_CHAINS } from './chains';
import { TESTNET_TOKENS } from './tokens';
import { TESTNET_GAS_ESTIMATES } from './gasEstimates';
import { TESTNET_RPC_MAPPING, TESTNET_REST_MAPPING } from './rpcs';

export * from './chains';
export * from './rpcs';
export * from './tokens';
export * from './gasEstimates';

const TESTNET: NetworkData = {
  chains: TESTNET_CHAINS,
  tokens: TESTNET_TOKENS,
  gasEstimates: TESTNET_GAS_ESTIMATES,
  rpc: TESTNET_RPC_MAPPING,
  rest: TESTNET_REST_MAPPING,
};

export default TESTNET;
