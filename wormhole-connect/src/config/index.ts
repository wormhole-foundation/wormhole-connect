import {
  WormholeContext as LegacyWormholeContext,
  WormholeConfig,
  ChainResourceMap,
} from 'sdklegacy';
import MAINNET from './mainnet';
import TESTNET from './testnet';
import DEVNET from './devnet';
import type { WormholeConnectConfig } from './types';
import { InternalConfig, WrappedTokenAddressCache } from './types';
import {
  mergeCustomTokensConfig,
  mergeCustomWrappedTokens,
  validateDefaults,
} from './utils';
import { wrapEventHandler } from './events';
import { capitalize } from './utils';

import { SDKConverter } from './converter';

import {
  wormhole as getWormholeV2,
  Wormhole as WormholeV2,
  Network,
  Token as TokenV2,
  ChainTokens as ChainTokensV2,
  WormholeConfigOverrides as WormholeConfigOverridesV2,
  Chain,
} from '@wormhole-foundation/sdk';

import '@wormhole-foundation/sdk/addresses';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import aptos from '@wormhole-foundation/sdk/aptos';
import sui from '@wormhole-foundation/sdk/sui';
import cosmwasm from '@wormhole-foundation/sdk/cosmwasm';
import algorand from '@wormhole-foundation/sdk/algorand';
import RouteOperator from 'routes/operator';
import { getTokenDecimals, getWrappedTokenId } from 'utils';
import { CHAIN_ORDER } from './constants';
import { getTokenBridgeWrappedTokenAddressSync } from 'utils/sdkv2';

export function buildConfig(
  customConfig?: WormholeConnectConfig,
): InternalConfig<Network> {
  const network = capitalize(
    customConfig?.network ||
      customConfig?.env || // TODO remove; deprecated
      import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase() ||
      'Mainnet',
  ) as Network;

  if (!['Mainnet', 'Testnet', 'Devnet'].includes(network))
    throw new Error(
      `Invalid env "${network}": Use "Testnet", "Devnet", or "Mainnet"`,
    );

  const networkData = { MAINNET, DEVNET, TESTNET }[network.toUpperCase()]!;

  const tokens = mergeCustomTokensConfig(
    networkData.tokens,
    customConfig?.tokensConfig,
  );

  const wrappedTokens = mergeCustomWrappedTokens(
    networkData.wrappedTokens,
    customConfig?.wrappedTokens,
  );

  const sdkConfig = LegacyWormholeContext.getConfig(network);

  const rpcs = Object.assign(
    {},
    sdkConfig.rpcs,
    networkData.rpcs,
    customConfig?.rpcs,
  );

  const whLegacy = getLegacyWormholeContext(network, sdkConfig, rpcs);

  if (customConfig?.bridgeDefaults) {
    validateDefaults(customConfig.bridgeDefaults, networkData.chains, tokens);
  }

  const sdkConverter = new SDKConverter(whLegacy);

  return {
    whLegacy,
    sdkConfig,
    sdkConverter,

    network,
    isMainnet: network === 'Mainnet',

    // External resources
    rpcs,
    rest: Object.assign(
      {},
      sdkConfig.rest,
      networkData.rest,
      customConfig?.rest,
    ),
    graphql: Object.assign({}, networkData.graphql, customConfig?.graphql),
    wormholeApi: {
      Mainnet: 'https://api.wormholescan.io/',
      Testnet: 'https://api.testnet.wormholescan.io/',
      Devnet: '',
    }[network],
    wormholeRpcHosts: {
      Mainnet: [
        'https://wormhole-v2-mainnet-api.mcf.rocks',
        'https://wormhole-v2-mainnet-api.chainlayer.network',
        'https://wormhole-v2-mainnet-api.staking.fund',
      ],
      Testnet: [
        'https://guardian.testnet.xlabs.xyz',
        'https://guardian-01.testnet.xlabs.xyz',
        'https://guardian-02.testnet.xlabs.xyz',
      ],
      Devnet: ['http://localhost:7071'],
    }[network],
    coinGeckoApiKey: customConfig?.coinGeckoApiKey,

    // Callbacks
    triggerEvent: wrapEventHandler(customConfig?.eventHandler),
    validateTransfer: customConfig?.validateTransferHandler,
    isRouteSupportedHandler: customConfig?.isRouteSupportedHandler,

    // White lists
    chains: networkData.chains,
    chainsArr: Object.values(networkData.chains)
      .filter((chain) => {
        return customConfig?.chains
          ? customConfig.chains.includes(chain.key)
          : true;
      })
      .sort((a, b) => {
        const ai = CHAIN_ORDER.indexOf(a.key);
        const bi = CHAIN_ORDER.indexOf(b.key);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return 0;
      }),
    tokens,
    tokensArr: Object.values(tokens).filter((token) => {
      return customConfig?.tokens
        ? customConfig.tokens!.includes(token.key)
        : true;
    }),

    // For token bridge =^_^=
    wrappedTokenAddressCache: new WrappedTokenAddressCache(
      tokens,
      wrappedTokens,
    ),

    routes: new RouteOperator(customConfig?.routes),

    // UI details
    cta: customConfig?.cta,
    explorer: customConfig?.explorer,
    attestUrl: {
      mainnet: 'https://portalbridge.com/advanced-tools/#/register',
      devnet: '',
      testnet:
        'https://wormhole-foundation.github.io/example-token-bridge-ui/#/register',
    }[network],
    bridgeDefaults: customConfig?.bridgeDefaults,
    cctpWarning: customConfig?.cctpWarning?.href || '',
    pageHeader: customConfig?.pageHeader,
    pageSubHeader: customConfig?.pageSubHeader,
    menu: customConfig?.menu ?? [],
    searchTx: customConfig?.searchTx,
    moreTokens: customConfig?.moreTokens,
    moreNetworks: customConfig?.moreNetworks,
    partnerLogo: customConfig?.partnerLogo,
    walletConnectProjectId:
      customConfig?.walletConnectProjectId ??
      import.meta.env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
    showHamburgerMenu: customConfig?.showHamburgerMenu ?? false,
    previewMode: !!customConfig?.previewMode,

    // Route options
    ethBridgeMaxAmount: customConfig?.ethBridgeMaxAmount ?? 5,
    wstETHBridgeMaxAmount: customConfig?.wstETHBridgeMaxAmount ?? 5,

    // Guardian Set
    guardianSet: networkData.guardianSet,
  };
}

// Running buildConfig with no argument generates the default configuration
const config = buildConfig();
export default config;

// TODO SDKV2: REMOVE
export function getLegacyWormholeContext(
  network: Network,
  sdkConfig: WormholeConfig,
  rpcs: ChainResourceMap,
): LegacyWormholeContext {
  const wh: LegacyWormholeContext = new LegacyWormholeContext(network, {
    ...sdkConfig,
    ...{ rpcs },
  });

  return wh;
}

export function getDefaultWormholeContext(
  network: Network,
): LegacyWormholeContext {
  const sdkConfig = LegacyWormholeContext.getConfig(network);
  const networkData = { Mainnet: MAINNET, Devnet: DEVNET, Testnet: TESTNET }[
    network
  ]!;

  const rpcs = Object.assign({}, sdkConfig.rpcs, networkData.rpcs);

  return getLegacyWormholeContext(network, sdkConfig, rpcs);
}

export async function getWormholeContextV2(): Promise<WormholeV2<Network>> {
  if (config._v2Wormhole) return config._v2Wormhole;
  config._v2Wormhole = await newWormholeContextV2();
  return config._v2Wormhole;
}

export async function newWormholeContextV2(): Promise<WormholeV2<Network>> {
  const v2Config: WormholeConfigOverridesV2<Network> = { chains: {} };

  for (const key in config.chains) {
    const chain = key as Chain;

    const rpc = config.rpcs[chain];
    const tokenMap: ChainTokensV2 = {};

    for (const token of config.tokensArr) {
      const tokenV2: Partial<TokenV2> = {
        key: token.key,
        chain: chain,
        symbol: token.symbol,
      };

      if (token.nativeChain === chain) {
        const address = config.sdkConverter.getNativeTokenAddressV2(token);
        if (!address) throw new Error('Token must have address');
        tokenV2.address = address;
        tokenV2.decimals = token.decimals;
      } else {
        tokenV2.original = token.nativeChain;
        const fa = getTokenBridgeWrappedTokenAddressSync(token, chain);
        if (fa) {
          tokenV2.address = fa.toString();
          tokenV2.decimals = getTokenDecimals(chain, getWrappedTokenId(token));
        } else {
          continue;
        }
      }

      tokenMap[token.key] = tokenV2 as TokenV2;
    }

    v2Config.chains![chain] = { rpc, tokenMap };
  }

  return await getWormholeV2(
    config.network,
    [evm, solana, aptos, cosmwasm, sui, algorand],
    v2Config,
  );
}

// setConfig can be called afterwards to override the default config with integrator-provided config

export function setConfig(customConfig?: WormholeConnectConfig) {
  const newConfig: InternalConfig<Network> = buildConfig(customConfig);

  // We overwrite keys in the existing object so the references to the config
  // imported elsewhere point to the new values
  for (const key in newConfig) {
    /* @ts-ignore */
    config[key] = newConfig[key];
  }
}

// TODO: add config validation step to buildConfig
//validateConfigs();
