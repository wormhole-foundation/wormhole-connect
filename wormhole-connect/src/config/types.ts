import {
  ChainConfig,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';

export type TokenConfig = {
  symbol: string;
  nativeNetwork: ChainName;
  icon: Icon;
  tokenId?: TokenId; // if no token id, it is the native token
  coinGeckoId: string;
  color: string;
  decimals: number;
  solDecimals: number;
  wrappedAsset?: string;
};

export interface NetworkConfig extends ChainConfig {
  displayName: string;
  explorerUrl: string;
  explorerName: string;
  gasToken: string;
  chainId: number;
  icon: Icon;
  automaticRelayer?: boolean;
}

export type NetworksConfig = {
  [chain in ChainName]?: NetworkConfig;
};

export enum Icon {
  'AVAX' = 1,
  'BNB',
  'BSC',
  'CELO',
  'ETH',
  'FANTOM',
  'POLYGON',
  'SOLANA',
  'USDC',
  'GLMR',
}
