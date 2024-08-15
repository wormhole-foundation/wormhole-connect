import { NetworkData } from 'config/types';
import { TESTNET_CHAINS } from './chains';
import {
  TESTNET_GRAPHQL_MAPPING,
  TESTNET_REST_MAPPING,
  TESTNET_RPC_MAPPING,
} from './rpcs';
import { TESTNET_TOKENS } from './tokens';
import { TESTNET_NTT_CONFIG } from './nttConfig';

export * from './chains';
export * from './rpcs';
export * from './tokens';

const TESTNET: NetworkData = {
  chains: TESTNET_CHAINS,
  tokens: TESTNET_TOKENS,
  rpcs: TESTNET_RPC_MAPPING,
  rest: TESTNET_REST_MAPPING,
  graphql: TESTNET_GRAPHQL_MAPPING,
  nttConfig: TESTNET_NTT_CONFIG,
  guardianSet: {
    index: 0,
    keys: ['0x13947Bd48b18E53fdAeEe77F3473391aC727C638'],
  },
};

export default TESTNET;
