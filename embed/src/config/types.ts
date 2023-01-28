import { ChainConfig, ChainName } from '@sdk';

export type TokenConfig = {
  symbol: string;
  icon: string;
  address?: string;
  coinGeckoId: string;
  color: string;
  decimals: number;
};

export interface NetworkConfig extends ChainConfig {
  icon?: string;
};

export type NetworksConfig = {
  [chain in ChainName]?: NetworkConfig;
};