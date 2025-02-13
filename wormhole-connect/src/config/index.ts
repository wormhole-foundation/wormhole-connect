import {
  WormholeContext as LegacyWormholeContext,
  WormholeConfig,
  ChainResourceMap,
} from 'sdklegacy';
import MAINNET from './mainnet';
import TESTNET from './testnet';
import DEVNET from './devnet';
import type { WormholeConnectConfig } from './types';
import { InternalConfig } from './types';
import { mergeCustomWrappedTokens, validateDefaults } from './utils';
import { wrapEventHandler } from './events';
import { capitalize } from './utils';

import {
  wormhole as getWormholeV2,
  Wormhole as WormholeV2,
  Network,
  Token as SDKToken,
  ChainTokens as SDKChainTokens,
  WormholeConfigOverrides as WormholeConfigOverridesV2,
  Chain,
} from '@wormhole-foundation/sdk';

import '@wormhole-foundation/sdk/addresses';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import aptos from '@wormhole-foundation/sdk/aptos';
import sui from '@wormhole-foundation/sdk/sui';
import RouteOperator from 'routes/operator';
import { CHAIN_ORDER } from './constants';
import { createUiConfig } from './ui';
import { buildTokenCache } from './tokens';

export function buildConfig(
  customConfig: WormholeConnectConfig = {},
): InternalConfig<Network> {
  const network = capitalize(
    customConfig.network ||
      import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase() ||
      'Mainnet',
  ) as Network;

  if (!['Mainnet', 'Testnet', 'Devnet'].includes(network))
    throw new Error(
      `Invalid env "${network}": Use "Testnet", "Devnet", or "Mainnet"`,
    );

  const networkData = { MAINNET, DEVNET, TESTNET }[network.toUpperCase()]!;

  const wrappedTokens = mergeCustomWrappedTokens(
    networkData.wrappedTokens,
    customConfig.wrappedTokens,
  );

  const tokens = buildTokenCache(
    network,
    [
      ...networkData.tokens,
      ...(customConfig.tokensConfig
        ? Object.values(customConfig.tokensConfig)
        : []),
    ],
    wrappedTokens,
  );

  const sdkConfig = LegacyWormholeContext.getConfig(network);

  const rpcs = Object.assign(
    {},
    sdkConfig.rpcs,
    networkData.rpcs,
    customConfig.rpcs,
  );

  const whLegacy = getLegacyWormholeContext(network, sdkConfig, rpcs);

  if (customConfig.ui?.defaultInputs) {
    validateDefaults(customConfig.ui.defaultInputs, networkData.chains, tokens);
  }

  const ui = createUiConfig(customConfig.ui ?? {});

  if (
    customConfig.tokens &&
    customConfig.tokens.length > 0 &&
    ui.disableUserInputtedTokens === undefined
  ) {
    // If the integrator has provided a whitelist of tokens, we can reasonably assume they also don't want
    // users pasting in arbitrary token addresses.
    ui.disableUserInputtedTokens = true;
  }

  return {
    whLegacy,
    sdkConfig,

    network,
    isMainnet: network === 'Mainnet',

    // External resources
    rpcs,
    mayanApi: 'https://explorer-api.mayan.finance',
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
    coinGeckoApiKey: customConfig.coinGeckoApiKey,

    // Callbacks
    triggerEvent: wrapEventHandler(customConfig.eventHandler),
    validateTransfer: customConfig.validateTransferHandler,
    isRouteSupportedHandler: customConfig.isRouteSupportedHandler,

    // White lists
    chains: networkData.chains,
    chainsArr: Object.values(networkData.chains)
      .filter((chain) => {
        return customConfig.chains
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
    tokenWhitelist: customConfig.tokens,

    routes: new RouteOperator(customConfig.routes),

    // UI details
    ui: createUiConfig({ ...customConfig.ui }),

    // Guardian Set
    guardianSet: networkData.guardianSet,

    // Transaction settings
    transactionSettings: customConfig?.transactionSettings || {},
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

export async function getWormholeContextV2(): Promise<WormholeV2<Network>> {
  if (config._v2Wormhole) return config._v2Wormhole;
  config._v2Wormhole = await newWormholeContextV2();
  return config._v2Wormhole;
}

// To be used when something changes, like a new token being added which should be in the token map
export async function clearWormholeContextV2() {
  delete config._v2Wormhole;
}

export async function newWormholeContextV2(): Promise<WormholeV2<Network>> {
  const v2Config: WormholeConfigOverridesV2<Network> = { chains: {} };

  for (const key in config.chains) {
    const chain = key as Chain;
    const rpc = config.rpcs[chain];
    const tokenMap: SDKChainTokens = {};

    for (const token of config.tokens.getAllForChain(chain)) {
      const sdkToken: Partial<SDKToken> = {
        key: token.key,
        chain: chain,
        symbol: token.symbol,
        address: token.address.toString(),
        decimals: token.decimals,
      };

      tokenMap[token.address.toString()] = sdkToken as SDKToken;
    }

    v2Config.chains![chain] = { rpc, tokenMap };
  }

  return await getWormholeV2(
    config.network,
    [evm, solana, aptos, sui],
    v2Config,
  );
}

// setConfig can be called afterwards to override the default config with integrator-provided config

export function setConfig(customConfig: WormholeConnectConfig = {}) {
  const newConfig: InternalConfig<Network> = buildConfig(customConfig);

  // We overwrite keys in the existing object so the references to the config
  // imported elsewhere point to the new values
  for (const key in newConfig) {
    /* @ts-ignore */
    config[key] = newConfig[key];
  }
  if (typeof window !== 'undefined') {
    /* @ts-ignore */
    window._connectConfig = config;
  }
}

// TODO: add config validation step to buildConfig
//validateConfigs();
