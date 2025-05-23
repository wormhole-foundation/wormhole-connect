import { WormholeConfig } from '../types';

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
};

export default DEVNET_CONFIG;
