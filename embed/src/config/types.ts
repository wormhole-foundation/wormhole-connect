import {
  ChainConfig,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';

export type TokenConfig = {
  symbol: string;
  nativeNetwork: ChainName;
  icon: string;
  tokenId: TokenId | 'native';
  coinGeckoId: string;
  color: string;
  decimals: number;
};

export interface NetworkConfig extends ChainConfig {
  icon?: string;
  nativeToken: string;
}

export type NetworksConfig = {
  [chain in ChainName]?: NetworkConfig;
};
