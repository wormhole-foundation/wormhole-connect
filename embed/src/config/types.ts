import { ChainConfig, ChainName, TokenId } from '@sdk';

export type TokenConfig = {
  symbol: string;
  nativeNetwork: ChainName,
  icon: string;
  tokenId: TokenId | 'native';
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