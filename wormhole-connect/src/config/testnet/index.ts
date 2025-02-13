import { NetworkData } from 'config/types';
import { TESTNET_CHAINS } from './chains';
import { TESTNET_RPC_MAPPING } from './rpcs';
import { TESTNET_TOKENS } from './tokens';
import { TESTNET_WRAPPED_TOKENS } from './wrappedTokens';

export * from './chains';
export * from './rpcs';
export * from './tokens';

const TESTNET: NetworkData = {
  chains: TESTNET_CHAINS,
  tokens: TESTNET_TOKENS,
  wrappedTokens: TESTNET_WRAPPED_TOKENS,
  rpcs: TESTNET_RPC_MAPPING,
  guardianSet: {
    index: 0,
    keys: ['0x13947Bd48b18E53fdAeEe77F3473391aC727C638'],
  },
};

export default TESTNET;
