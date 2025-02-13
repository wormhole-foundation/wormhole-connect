import { Chain } from '@wormhole-foundation/sdk';
import { ChainConfig, Context, WormholeConfig } from '../types';

const DEVNET: { [chain in Chain]?: ChainConfig } = {
  Ethereum: {
    key: 'Ethereum',
    id: 2,
    context: Context.ETH,
  },
} as const;

/**
 * default devnet chain config
 */
const DEVNET_CONFIG: WormholeConfig = {
  env: 'Devnet',
  rpcs: {
    Ethereum: 'http://localhost:8545',
    Wormchain: 'http://localhost:26659',
    Osmosis: 'http://localhost:33043',
    Terra2: 'http://localhost:26658',
  },
  chains: DEVNET,
};

export default DEVNET_CONFIG;
