import {
  ChainConfig,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';

export type TokenConfig = {
  symbol: string;
  nativeNetwork: ChainName;
  icon: string;
  tokenId?: TokenId; // if no token id, it is the native token
  coinGeckoId: string;
  color: string;
  decimals: number;
  solDecimals: number;
  wrappedAsset?: string;
};

export interface NetworkConfig extends ChainConfig {
  icon?: string;
  nativeToken: string;
  automaticRelayer?: boolean;
}

export type NetworksConfig = {
  [chain in ChainName]?: NetworkConfig;
};
