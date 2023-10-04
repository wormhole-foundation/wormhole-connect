import { NetworkData } from 'config/types';
import { TESTNET_CHAINS } from './chains';
import { TESTNET_GAS_ESTIMATES } from './gasEstimates';
import {
  TESTNET_GRAPHQL_MAPPING,
  TESTNET_REST_MAPPING,
  TESTNET_RPC_MAPPING,
} from './rpcs';
import { TESTNET_TOKENS } from './tokens';

export * from './chains';
export * from './gasEstimates';
export * from './rpcs';
export * from './tokens';

const TESTNET: NetworkData = {
  chains: TESTNET_CHAINS,
  tokens: TESTNET_TOKENS,
  gasEstimates: TESTNET_GAS_ESTIMATES,
  rpcs: TESTNET_RPC_MAPPING,
  rest: TESTNET_REST_MAPPING,
  graphql: TESTNET_GRAPHQL_MAPPING,
};

export default TESTNET;
