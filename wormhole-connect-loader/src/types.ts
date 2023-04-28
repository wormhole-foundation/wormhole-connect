import { Theme } from './theme';
export const MAINNET_CHAINS = {
  solana: 1,
  ethereum: 2,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  fantom: 10,
  celo: 14,
  moonbeam: 16,
} as const;
export type MainnetChainName = keyof typeof MAINNET_CHAINS;
export type MainnetChainId = (typeof MAINNET_CHAINS)[MainnetChainName];

export const TESTNET_CHAINS = {
  solana: 1,
  goerli: 2,
  bsc: 4,
  mumbai: 5,
  fuji: 6,
  fantom: 10,
  alfajores: 14,
  moonbasealpha: 16,
} as const;
export type TestnetChainName = keyof typeof TESTNET_CHAINS;
export type TestnetChainId = (typeof TESTNET_CHAINS)[TestnetChainName];

export type ChainName = MainnetChainName | TestnetChainName;
export type ChainId = MainnetChainId | TestnetChainId;

export type Rpcs = {
  [chain in ChainName]?: string;
};

export interface BridgeDefaults {
  fromNetwork?: ChainName;
  toNetwork?: ChainName;
  token?: string;
}

export interface WormholeConnectConfig {
  env?: 'mainnet' | 'testnet';
  rpcs?: Rpcs;
  networks?: ChainName[];
  tokens?: string[];
  mode?: 'dark' | 'light';
  customTheme?: Theme;
  cta?: {
    text: string;
    link: string;
  };
  bridgeDefaults?: BridgeDefaults;
}
