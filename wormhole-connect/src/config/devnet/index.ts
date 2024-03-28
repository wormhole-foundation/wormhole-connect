import { NetworkData } from 'config/types';
import { DEVNET_CHAINS } from './chains';
import { DEVNET_GAS_ESTIMATES } from './gasEstimates';
import {
  DEVNET_GRAPHQL_MAPPING,
  DEVNET_REST_MAPPING,
  DEVNET_RPC_MAPPING,
} from './rpcs';
import { DEVNET_TOKENS } from './tokens';
import { DEVNET_NTT_GROUPS } from './nttGroups';

export * from './chains';
export * from './gasEstimates';
export * from './rpcs';
export * from './tokens';

const DEVNET: NetworkData = {
  chains: DEVNET_CHAINS,
  tokens: DEVNET_TOKENS,
  gasEstimates: DEVNET_GAS_ESTIMATES,
  rpcs: DEVNET_RPC_MAPPING,
  rest: DEVNET_REST_MAPPING,
  graphql: DEVNET_GRAPHQL_MAPPING,
  nttGroups: DEVNET_NTT_GROUPS,
};

export default DEVNET;
