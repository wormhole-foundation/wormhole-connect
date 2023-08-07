import { Network as Environment } from '@certusone/wormhole-sdk';
import { ChainConfig, Context, Contracts, WormholeConfig } from '../types';

/**
 * devnet chain name to chain id mapping
 */
export const DEVNET_CHAINS = {
  ethereum: 2,
  osmosis: 20,
  wormchain: 3104,
} as const;

/**
 * devnet chain name type
 */
export type DevnetChainName = keyof typeof DEVNET_CHAINS;
/**
 * devnet chain id type
 */
export type DevnetChainId = (typeof DEVNET_CHAINS)[DevnetChainName];
/**
 * chain name to contracts mapping
 */
export type ChainContracts = {
  [chain in DevnetChainName]: Contracts;
};

const DEVNET: { [chain in DevnetChainName]: ChainConfig } = {
  ethereum: {
    key: 'ethereum',
    id: 2,
    context: Context.ETH,
    contracts: {
      core: '0xC89Ce4735882C9F0f0FE26686c53074E09B0D550',
      token_bridge: '0x0290FB167208Af455bB137780163b7B7a9a10C16',
    },
    finalityThreshold: 64,
    nativeTokenDecimals: 18,
  },
  osmosis: {
    key: 'osmosis',
    id: 20,
    context: Context.COSMOS,
    contracts: {
      core: '',
      token_bridge: '',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  wormchain: {
    context: Context.COSMOS,
    key: 'wormchain',
    id: 3104,
    contracts: {
      core: 'wormhole14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9srrg465',
      token_bridge:
        'wormhole1qg5ega6dykkxc307y25pecuufrjkxkaggkkxh7nad0vhyhtuhw3svg697z',
      ibcShimContract:
        'wormhole1ghd753shjuwexxywmgs4xz7x2q732vcnkm6h2pyv9s6ah3hylvrqtm7t3h',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
};

const env: Environment = 'DEVNET';
/**
 * default devnet chain config
 */
const DEVNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    ethereum: 'http://localhost:8545',
    wormchain: 'http://localhost:32778',
    osmosis: 'http://localhost:32806',
  },
  rest: {},
  chains: DEVNET,
  wormholeHosts: ['http://localhost:7071'],
};

export default DEVNET_CONFIG;
