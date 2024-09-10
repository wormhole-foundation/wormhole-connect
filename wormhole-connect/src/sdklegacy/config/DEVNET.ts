import { Chain } from '@wormhole-foundation/sdk';
import { ChainConfig, Context, WormholeConfig } from '../types';

const DEVNET: { [chain in Chain]?: ChainConfig } = {
  Ethereum: {
    key: 'Ethereum',
    id: 2,
    context: Context.ETH,
    finalityThreshold: 64,
  },
  //Osmosis: {
  //  key: 'Osmosis',
  //  id: 20,
  //  context: Context.COSMOS,
  //  finalityThreshold: 0,
  //},
  //Wormchain: {
  //  context: Context.COSMOS,
  //  key: 'Wormchain',
  //  id: 3104,
  //  finalityThreshold: 0,
  //},
  //Terra2: {
  //  context: Context.COSMOS,
  //  key: 'Terra2',
  //  id: 18,
  //  finalityThreshold: 0,
  //},
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
  rest: {},
  graphql: {},
  chains: DEVNET,
  wormholeHosts: ['http://localhost:7071'],
};

export default DEVNET_CONFIG;
