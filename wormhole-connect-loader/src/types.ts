import { Theme } from "./theme";
export const MAINNET_CHAINS = {
  solana: 1,
  ethereum: 2,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  fantom: 10,
  celo: 14,
  moonbeam: 16,
  osmosis: 20,
  sui: 21,
  aptos: 22,
  arbitrum: 23,
  optimism: 24,
  base: 30,
  evmos: 4001,
  kujira: 4002,
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
  osmosis: 20,
  sui: 21,
  aptos: 22,
  arbitrumgoerli: 23,
  optimismgoerli: 24,
  basegoerli: 30,
  evmos: 4001,
  kujira: 4002,
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
  requiredNetwork?: ChainName;
}

// Keep this in sync with wormhole-connect/src/config/types.ts!
// TODO: move to a shared package
export interface WormholeConnectConfig {
  showHamburgerMenu?: boolean;
  env?: "mainnet" | "testnet" | "devnet";
  rpcs?: Rpcs;
  rest?: Rpcs;
  networks?: ChainName[];
  tokens?: string[];
  mode?: "dark" | "light";
  customTheme?: Theme;
  cta?: {
    text: string;
    link: string;
  };
  menu?: MenuEntry[];
  bridgeDefaults?: BridgeDefaults;
  routes?: string[];
  pageHeader?: string;
  pageSubHeader?: string;
  searchTx?: SearchTxConfig;
  moreTokens?: MoreTokenConfig;
  extraNetworks?: ExtraChainConfig;
}

export type SearchTxConfig = {
  txHash?: string;
  chainName?: ChainName;

}

export type MoreTokenConfig = {
  label: string;
  href: string;
};

export type ExtraChainConfig = {
  href: string;
  target?: "_blank" | "_self";
  description: string;
  networks: ExtraChainDefintion[];
};

export type ExtraChainDefintion = {
  icon: string;
  href?: string;
  label: string;
  name: string;
  description?: string;
  target?: "_blank" | "_self";
  showOpenInNewIcon?: boolean;
};

export interface MenuEntry {
  label: string;
  href: string;
  target?: string;
  order?: number;
}
