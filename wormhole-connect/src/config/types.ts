import {
  ChainConfig as BaseChainConfig,
  ChainName,
  TokenId,
  ChainResourceMap,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Alignment } from 'components/Header';
import { ExtendedTheme } from 'theme';

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
  'DAI',
  'USDT',
  'BUSD',
  'WBTC',
  'SUI',
  'APT',
  'SEI',
  'BASE',
  'OSMO',
  'BONK',
  'TBTC',
  'WSTETH',
  'ARBITRUM',
  'OPTIMISM',
  'ATOM',
  'EVMOS',
  'KUJI',
  'PYTH',
}

export enum Route {
  Bridge = 'bridge',
  Relay = 'relay',
  // Hashflow = 'hashflow',
  CosmosGateway = 'cosmosGateway',
  CCTPManual = 'cctpManual',
  CCTPRelay = 'cctpRelay',
  TBTC = 'tbtc',
  ETHBridge = 'ethBridge',
  wstETHBridge = 'wstETHBridge',
}

export type SupportedRoutes = keyof typeof Route;

// TODO: preference is fromChain/toChain, but want to keep backwards compatibility
export interface BridgeDefaults {
  fromNetwork?: ChainName;
  toNetwork?: ChainName;
  token?: string;
  requiredNetwork?: ChainName;
}

// Keep this in sync with wormhole-connect-loader/src/types.ts!
// TODO: move to a shared package
export interface WormholeConnectConfig {
  showHamburgerMenu?: boolean;
  env?: 'mainnet' | 'testnet' | 'devnet';
  rpcs?: ChainResourceMap;
  rest?: ChainResourceMap;
  graphql?: ChainResourceMap;
  networks?: ChainName[];
  tokens?: string[];
  mode?: 'dark' | 'light';
  customTheme?: ExtendedTheme;
  cta?: {
    text: string;
    link: string;
  };
  explorer?: ExplorerConfig;
  bridgeDefaults?: BridgeDefaults;
  routes?: string[];
  cctpWarning?: {
    href: string;
  };
  pageHeader?: string | PageHeader;
  pageSubHeader?: string;
  menu?: MenuEntry[];
  searchTx?: SearchTxConfig;
  moreTokens?: MoreTokenConfig;
  moreNetworks?: MoreChainConfig;
  partnerLogo?: string;
  walletConnectProjectId?: string;
  ethBridgeMaxAmount?: number;
  wstETHBridgeMaxAmount?: number;
}

export type ExplorerConfig = {
  href: string;
  label?: string;
  target?: '_blank' | '_self';
};

export type PageHeader = {
  text: string;
  align: Alignment;
};

export type SearchTxConfig = {
  txHash?: string;
  chainName?: ChainName;
};

export type MoreTokenConfig = {
  label: string;
  href: string;
  target?: '_blank' | '_self';
};

export type MoreChainConfig = {
  href: string;
  target?: '_blank' | '_self';
  description: string;
  networks: MoreChainDefinition[];
};

export type MoreChainDefinition = {
  icon: string;
  href?: string;
  label: string;
  name?: string;
  description?: string;
  target?: '_blank' | '_self';
  showOpenInNewIcon?: boolean;
};

type DecimalsMap = Partial<Record<Context, number>> & {
  default: number;
};

export type TokenConfig = {
  key: string;
  symbol: string;
  nativeChain: ChainName;
  icon: Icon;
  tokenId?: TokenId; // if no token id, it is the native token
  coinGeckoId: string;
  color: string;
  decimals: DecimalsMap;
  wrappedAsset?: string;
  displayName?: string;
  foreignAssets?: {
    [chainName in ChainName]?: {
      address: string;
      decimals: number;
    };
  };
};

export type TokensConfig = { [key: string]: TokenConfig };

export interface ChainConfig extends BaseChainConfig {
  displayName: string;
  explorerUrl: string;
  explorerName: string;
  gasToken: string;
  chainId: number | string;
  icon: Icon;
  maxBlockSearch: number;
  automaticRelayer?: boolean;
}

export type ChainsConfig = {
  [chain in ChainName]?: ChainConfig;
};

export type GasEstimatesByOperation = {
  sendToken?: number;
  sendNative?: number;
  claim?: number;
};

export type GasEstimateOptions = keyof GasEstimatesByOperation;

export type GasEstimates = {
  [chain in ChainName]?: {
    [route in Route]?: GasEstimatesByOperation;
  };
};

export type RpcMapping = { [chain in ChainName]?: string };

export type NetworkData = {
  chains: ChainsConfig;
  tokens: TokensConfig;
  gasEstimates: GasEstimates;
  rpcs: RpcMapping;
  rest: RpcMapping;
  graphql: RpcMapping;
};

export interface MenuEntry {
  label: string;
  href: string;
  target?: string;
  order?: number;
}
