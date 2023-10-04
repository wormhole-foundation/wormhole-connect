import { NetworkData } from 'config/types';
import { MAINNET_CHAINS } from './chains';
import { MAINNET_GAS_ESTIMATES } from './gasEstimates';
import {
  MAINNET_GRAPHQL_MAPPING,
  MAINNET_REST_MAPPING,
  MAINNET_RPC_MAPPING,
} from './rpcs';
import { MAINNET_TOKENS } from './tokens';

export * from './chains';
export * from './gasEstimates';
export * from './rpcs';
export * from './tokens';

const MAINNET: NetworkData = {
  chains: MAINNET_CHAINS,
  tokens: MAINNET_TOKENS,
  gasEstimates: MAINNET_GAS_ESTIMATES,
  rpcs: MAINNET_RPC_MAPPING,
  rest: MAINNET_REST_MAPPING,
  graphql: MAINNET_GRAPHQL_MAPPING,
};

export default MAINNET;
