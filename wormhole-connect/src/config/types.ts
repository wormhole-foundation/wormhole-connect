// Legacy SDK
import {
  ChainConfig as BaseChainConfig,
  TokenId,
  ChainResourceMap,
  WormholeContext,
  WormholeConfig,
} from 'sdklegacy';

// SDKv2
import {
  Network,
  Wormhole as WormholeV2,
  Chain,
  TokenAddress as TokenAddressV2,
} from '@wormhole-foundation/sdk';

import { TransferDetails, WormholeConnectEventHandler } from 'telemetry/types';
import { SDKConverter } from './converter';

import { routes } from '@wormhole-foundation/sdk';
import RouteOperator from 'routes/operator';
import { UiConfig } from './ui';

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
  'MANTLE',
}

// Used in bridging components
export type TransferSide = 'source' | 'destination';

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
  network?: Network; // New name for this, consistent with SDKv2

  // External resources
  rpcs?: ChainResourceMap;
  rest?: ChainResourceMap;
  graphql?: ChainResourceMap;
  coinGeckoApiKey?: string;

  // White lists
  chains?: Chain[];
  tokens?: string[];
  routes?: routes.RouteConstructor<any>[];

  // Custom tokens
  tokensConfig?: TokensConfig;

  // Wormhole-wrapped token addresses
  wrappedTokens?: TokenAddressesByChain;

  // Callbacks
  eventHandler?: WormholeConnectEventHandler;
  validateTransferHandler?: ValidateTransferHandler;
  isRouteSupportedHandler?: IsRouteSupportedHandler;

  // UI details
  ui?: UiConfig;
}

// This is the exported config value used throughout the code base
export interface InternalConfig<N extends Network> {
  network: N;
  // Cache. To be accessed via getWormholeContextV2(), not directly
  _v2Wormhole?: WormholeV2<N>;

  // Legacy TODO SDKV2 remove
  whLegacy: WormholeContext;

  sdkConfig: WormholeConfig;
  sdkConverter: SDKConverter;

  isMainnet: boolean;

  // External resources
  rpcs: ChainResourceMap;
  rest: ChainResourceMap;
  graphql: ChainResourceMap;
  mayanApi: string;
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

  // UI configuration
  ui: UiConfig;

  guardianSet: GuardianSetData;
}

export type TokenConfig = {
  key: string;
  symbol: string;
  nativeChain: Chain;
  icon: Icon | string;
  tokenId?: TokenId; // if no token id, it is the native token
  coinGeckoId: string;
  color?: string;
  decimals: number;
  wrappedAsset?: string;
  displayName?: string;
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
  wrappedTokens: TokenAddressesByChain; // wormhole-wrapped tokens
  rpcs: RpcMapping;
  rest: RpcMapping;
  graphql: RpcMapping;
  guardianSet: GuardianSetData;
};

export type TokenAddressesByChain = {
  [tokenKey: string]: {
    [chain in Chain]?: string;
  };
};

// Token bridge foreign asset cache
// Used in utils/sdkv2.ts

type ForeignAssets<C extends Chain> = Record<string, TokenAddressV2<C>>;

export class WrappedTokenAddressCache {
  caches: Partial<Record<Chain, ForeignAssets<Chain>>>;

  constructor(tokens: TokensConfig, addresses: TokenAddressesByChain) {
    this.caches = {};

    // Pre-populate cache with values from built-in config
    for (const [key, token] of Object.entries(tokens)) {
      // Cache any Wormhole-wrapped tokens
      const wrappedTokens = addresses[key];
      if (wrappedTokens) {
        for (const chain in wrappedTokens) {
          const foreignAsset = wrappedTokens[chain];
          const addr = WormholeV2.parseAddress(chain as Chain, foreignAsset);
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

// Transactions in Transaction History view
export interface Transaction {
  // Transaction hash
  txHash: string;

  // Stringified addresses
  sender?: string;
  recipient: string;

  amount: string;
  amountUsd: number;

  toChain: Chain;
  fromChain: Chain;

  // Source token address
  tokenAddress: string;
  tokenKey: string;
  tokenDecimals?: number;

  // Destination token
  receivedTokenKey: string;
  receiveAmount: string;

  // Timestamps
  senderTimestamp: string;
  receiverTimestamp?: string;

  // Explorer link
  explorerLink: string;

  // In-progress status
  inProgress: boolean;
}
