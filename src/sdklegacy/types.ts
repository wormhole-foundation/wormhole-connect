import type { Network, Chain } from '@wormhole-foundation/sdk';

export const NATIVE = 'native';

export type ChainResourceMap = {
  [chain in Chain]?: string;
};

export type WormholeConfig = {
  env: Network;
  rpcs: ChainResourceMap;
};

export type Address = string;

export type AnyContext = any;

export type AnyContracts = any;
