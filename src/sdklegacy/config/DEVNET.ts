import { WormholeConfig } from '../types';

/**
 * default devnet chain config
 */
const DEVNET_CONFIG: WormholeConfig = {
  env: 'Devnet',
  rpcs: {
    Ethereum: 'http://localhost:8545',
  },
};

export default DEVNET_CONFIG;
