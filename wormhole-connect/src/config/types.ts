// Legacy SDK
import {
  ChainConfig as BaseChainConfig,
  TokenId,
  ChainResourceMap,
  Context,
  WormholeContext,
  WormholeConfig,
} from 'sdklegacy';

// SDKv2
import {
  Network as NetworkV2,
  Wormhole as WormholeV2,
  Chain,
  TokenAddress as TokenAddressV2,
} from '@wormhole-foundation/sdk';

import { Alignment } from 'components/Header';
import { WormholeConnectPartialTheme } from 'theme';
import { TransferDetails, WormholeConnectEventHandler } from 'telemetry/types';
import { SDKConverter } from './converter';

import { routes } from '@wormhole-foundation/sdk';
import RouteOperator from 'routes/operator';

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
  'TBTC',
  'WSTETH',
  'ARBITRUM',
  'OPTIMISM',
  'ATOM',
  'EVMOS',
  'KUJI',
  'PYTH',
  'INJ',
  'KLAY',
  'NTT',
  'SCROLL',
  'BLAST',
  'XLAYER',
}

// Used in bridging components
export type TransferSide = 'source' | 'destination';

export type Network = 'mainnet' | 'testnet' | 'devnet';

// TODO: preference is fromChain/toChain, but want to keep backwards compatibility
// TOOD: rename to fromChain/toChain
export interface BridgeDefaults {
  fromNetwork?: Chain;
  toNetwork?: Chain;
  token?: string;
  requiredNetwork?: Chain;
}

export interface ExtendedTransferDetails extends TransferDetails {
  fromWalletAddress: string;
  toWalletAddress: string;
}

export interface ValidateTransferResult {
  isValid: boolean;
  error?: string;
}

export type ValidateTransferHandler = (
  transferDetails: ExtendedTransferDetails,
) => Promise<ValidateTransferResult>;

export type IsRouteSupportedHandler = (
  transferDetails: TransferDetails,
) => Promise<boolean>;

// This is the integrator-provided config
export interface WormholeConnectConfig {
  env?: Network; // TODO REMOVE; DEPRECATED
  network?: Network; // New name for this, consistent with SDKv2

  // External resources
  rpcs?: ChainResourceMap;
  rest?: ChainResourceMap;
  graphql?: ChainResourceMap;
  coinGeckoApiKey?: string;

  // White lists
  chains?: Chain[];
  tokens?: string[];

  // Custom tokens
  tokensConfig?: TokensConfig;

  // Legacy support: allow theme to be in this config object
  // This should be removed in a future version after people have switched
  // to providing the theme as a separate prop
  customTheme?: WormholeConnectPartialTheme;
  mode?: 'dark' | 'light';

  // Callbacks
  eventHandler?: WormholeConnectEventHandler;
  validateTransferHandler?: ValidateTransferHandler;
  isRouteSupportedHandler?: IsRouteSupportedHandler;

  // UI details
  cta?: {
    text: string;
    link: string;
  };
  showHamburgerMenu?: boolean;
  explorer?: ExplorerConfig;
  bridgeDefaults?: BridgeDefaults;
  routes?: routes.RouteConstructor<any>[];
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
  previewMode?: boolean;

  // Route settings
  ethBridgeMaxAmount?: number;
  wstETHBridgeMaxAmount?: number;

  // Override to load Redesign
  useRedesign?: boolean;
}

// This is the exported config value used throughout the code base
export interface InternalConfig<N extends NetworkV2> {
  wh: WormholeContext;

  sdkConfig: WormholeConfig;
  sdkConverter: SDKConverter;

  network: Network;

  // SDkv2
  v2Network: N;
  v2Wormhole?: WormholeV2<N>; // cache

  isMainnet: boolean;

  // External resources
  rpcs: ChainResourceMap;
  rest: ChainResourceMap;
  graphql: ChainResourceMap;
  wormholeApi: string;
  wormholeRpcHosts: string[];
  coinGeckoApiKey?: string;

  // White lists
  chains: ChainsConfig;
  chainsArr: ChainConfig[];
  tokens: TokensConfig;
  tokensArr: TokenConfig[];
  wrappedTokenAddressCache: WrappedTokenAddressCache;

  routes: RouteOperator;

  // Callbacks
  triggerEvent: WormholeConnectEventHandler;
  validateTransfer?: ValidateTransferHandler;
  isRouteSupportedHandler?: IsRouteSupportedHandler;

  // UI details
  cta?: {
    text: string;
    link: string;
  };
  explorer?: ExplorerConfig;
  attestUrl: string;
  bridgeDefaults?: BridgeDefaults;
  cctpWarning: string;
  pageHeader?: string | PageHeader;
  pageSubHeader?: string;
  menu: MenuEntry[];
  searchTx?: SearchTxConfig;
  moreTokens?: MoreTokenConfig;
  moreNetworks?: MoreChainConfig;
  partnerLogo?: string;
  walletConnectProjectId?: string;
  showHamburgerMenu: boolean;
  previewMode?: boolean; // Disables making transfers

  // Route settings
  ethBridgeMaxAmount: number;
  wstETHBridgeMaxAmount: number;

  guardianSet: GuardianSetData;

  // Redesign flag
  useRedesign?: boolean;
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
  chainName?: string;
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
  nativeChain: Chain;
  icon: Icon | string;
  tokenId?: TokenId; // if no token id, it is the native token
  coinGeckoId: string;
  color?: string;
  decimals: DecimalsMap;
  wrappedAsset?: string;
  displayName?: string;
  foreignAssets?: {
    [chain in Chain]?: {
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
  [chain in Chain]?: ChainConfig;
};

export type RpcMapping = { [chain in Chain]?: string };

export type GuardianSetData = {
  index: number;
  keys: string[];
};

export type NetworkData = {
  chains: ChainsConfig;
  tokens: TokensConfig;
  rpcs: RpcMapping;
  rest: RpcMapping;
  graphql: RpcMapping;
  guardianSet: GuardianSetData;
};

export interface MenuEntry {
  label: string;
  href: string;
  target?: string;
  order?: number;
}

export type NttTransceiverConfig = {
  address: string;
  type: 'wormhole'; // only wormhole is supported for now
};

// Token bridge foreign asset cache
// Used in utils/sdkv2.ts

type ForeignAssets<C extends Chain> = Record<string, TokenAddressV2<C>>;

export class WrappedTokenAddressCache {
  caches: Partial<Record<Chain, ForeignAssets<Chain>>>;

  constructor(tokens: TokensConfig, converter: SDKConverter) {
    this.caches = {};

    // Pre-populate cache with values from built-in config
    for (const key in tokens) {
      const token = tokens[key];

      if (token.foreignAssets) {
        for (const chain in token.foreignAssets) {
          const foreignAsset = tokens[key].foreignAssets![chain];
          const addr = WormholeV2.parseAddress(
            chain as Chain,
            foreignAsset.address,
          );
          this.set(key, chain as Chain, addr);
        }
      }

      // Cache it on its native chain too
      if (token.tokenId) {
        try {
          this.set(
            key,
            token.nativeChain,
            WormholeV2.parseAddress(token.nativeChain, token.tokenId.address),
          );
        } catch (e) {
          console.error(`Error caching foreign asset`, token.tokenId, e);
        }
      }
    }
  }

  get<C extends Chain>(tokenKey: string, chain: C): TokenAddressV2<C> | null {
    const chainCache = this.caches[chain] as ForeignAssets<C>;
    if (!chainCache) return null;
    return chainCache[tokenKey] || null;
  }

  set<C extends Chain>(
    tokenKey: string,
    chain: C,
    foreignAsset: TokenAddressV2<C>,
  ) {
    if (!this.caches[chain]) this.caches[chain] = {};
    const chainCache = this.caches[chain]!;
    chainCache[tokenKey] = foreignAsset;
  }
}
