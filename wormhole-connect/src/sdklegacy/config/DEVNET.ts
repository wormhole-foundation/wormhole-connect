import { ChainConfig, Context, WormholeConfig } from '../types';

/**
 * devnet chain name to chain id mapping
 */
export const DEVNET_CHAINS = {
  Ethereum: 2,
  Terra2: 18,
  Osmosis: 20,
  Wormchain: 3104,
} as const;
/**
 * devnet chain name type
 */
export type DevnetChainName = keyof typeof DEVNET_CHAINS;
/**
 * devnet chain id type
 */
export type DevnetChainId = (typeof DEVNET_CHAINS)[DevnetChainName];

const DEVNET: { [chain in DevnetChainName]: ChainConfig } = {
  Ethereum: {
    key: 'Ethereum',
    id: 2,
    context: Context.ETH,
    finalityThreshold: 64,
    nativeTokenDecimals: 18,
  },
  Osmosis: {
    key: 'Osmosis',
    id: 20,
    context: Context.COSMOS,
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  Wormchain: {
    context: Context.COSMOS,
    key: 'Wormchain',
    id: 3104,
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  Terra2: {
    context: Context.COSMOS,
    key: 'Terra2',
    id: 18,
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
};

/**
 * default devnet chain config
 */
const DEVNET_CONFIG: WormholeConfig = {
  env: 'devnet',
  rpcs: {
    Ethereum: 'http://localhost:8545',
    Wormchain: 'http://localhost:26659',
    Osmosis: 'http://localhost:33043',
    Terra2: 'http://localhost:26658',
  },
  rest: {},
  graphql: {},
  chains: DEVNET,
  wormholeHosts: ['http://localhost:7071'],
};

export default DEVNET_CONFIG;
