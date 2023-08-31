import {
  ChainConfig,
  ChainName,
  TokenId,
  ChainResourceMap,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { ExtendedTheme } from 'theme';
import { PayloadType } from 'utils/sdk';

export enum Route {
  Bridge = PayloadType.MANUAL, // 1
  Relay = PayloadType.AUTOMATIC, // 3
  Hashflow = 10,
  CosmosGateway = 11,
  CCTPManual = 12,
  CCTPRelay = 13,
}

export type SupportedRoutes = keyof typeof Route;

export interface BridgeDefaults {
  fromNetwork?: ChainName;
  toNetwork?: ChainName;
  token?: string;
  requiredNetwork?: ChainName;
}

export interface WormholeConnectConfig {
  env?: 'mainnet' | 'testnet' | 'devnet';
  rpcs?: ChainResourceMap;
  rest?: ChainResourceMap;
  networks?: ChainName[];
  tokens?: string[];
  mode?: 'dark' | 'light';
  customTheme?: ExtendedTheme;
  cta?: {
    text: string;
    link: string;
  };
  bridgeDefaults?: BridgeDefaults;
  routes?: string[];
}

type DecimalsMap = Partial<Record<Context, number>> & {
  default: number;
};

export type TokenConfig = {
  key: string;
  symbol: string;
  nativeNetwork: ChainName;
  icon: Icon;
  tokenId?: TokenId; // if no token id, it is the native token
  coinGeckoId: string;
  color: string;
  decimals: DecimalsMap;
  wrappedAsset?: string;
};

export interface NetworkConfig extends ChainConfig {
  displayName: string;
  explorerUrl: string;
  explorerName: string;
  gasToken: string;
  chainId: number | string;
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
  'DAI',
  'USDT',
  'BUSD',
  'WBTC',
  'SUI',
  'APT',
  'ARBITRUM',
  'OPTIMISM',
  'SEI',
  'BASE',
  'OSMO',
  'BONK',
  'TBTC',
  'WSTETH',
}

export type GasEstimates = {
  [chain in ChainName]?: {
    send?: number;
    sendNative: number;
    sendToken: number;
    claim: number;
    sendNativeWithRelay?: number;
    sendTokenWithRelay?: number;
    sendCCTPWithRelay?: number;
    sendCCTPManual?: number;
  };
};
