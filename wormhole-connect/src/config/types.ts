import {
  ChainConfig,
  ChainName,
  TokenId,
  Rpcs,
} from '@wormhole-foundation/wormhole-connect-sdk';

export interface WormholeConnectConfig {
  env?: 'mainnet' | 'testnet';
  rpcs?: Rpcs;
  networks?: ChainName[];
  tokens?: string[];
  mode?: 'dark' | 'light';
  customTheme?: any;
}

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
  maxBlockSearch: number;
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

export type GasEstimates = {
  [chain in ChainName]?: {
    send?: number;
    sendNative: number;
    sendToken: number;
    claim: number;
    sendNativeWithRelay?: number;
    sendTokenWithRelay?: number;
  };
};
