import { NetworkData } from 'config/types';
import { DEVNET_CHAINS } from './chains';
import {
  DEVNET_GRAPHQL_MAPPING,
  DEVNET_REST_MAPPING,
  DEVNET_RPC_MAPPING,
} from './rpcs';
import { DEVNET_TOKENS } from './tokens';
import { DEVNET_NTT_CONFIG } from './nttConfig';

export * from './chains';
export * from './rpcs';
export * from './tokens';

const DEVNET: NetworkData = {
  chains: DEVNET_CHAINS,
  tokens: DEVNET_TOKENS,
  rpcs: DEVNET_RPC_MAPPING,
  rest: DEVNET_REST_MAPPING,
  graphql: DEVNET_GRAPHQL_MAPPING,
  nttConfig: DEVNET_NTT_CONFIG,
  guardianSet: {
    index: 0,
    keys: ['0x13947Bd48b18E53fdAeEe77F3473391aC727C638'],
  },
};

export default DEVNET;
