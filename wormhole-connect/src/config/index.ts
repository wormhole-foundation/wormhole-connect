import {
  ChainName,
  WormholeContext,
  WormholeConfig,
  ChainResourceMap,
} from 'sdklegacy';
import MAINNET from './mainnet';
import TESTNET from './testnet';
import DEVNET from './devnet';
import type { WormholeConnectConfig } from './types';
import {
  Network,
  InternalConfig,
  Route,
  WrappedTokenAddressCache,
} from './types';
import {
  mergeCustomTokensConfig,
  mergeNttGroups,
  validateDefaults,
} from './utils';
import { wrapEventHandler } from './events';

import { SDKConverter } from './converter';

import {
  wormhole as getWormholeV2,
  Wormhole as WormholeV2,
  Network as NetworkV2,
  Token as TokenV2,
  Chain as ChainV2,
  ChainTokens as ChainTokensV2,
  WormholeConfigOverrides as WormholeConfigOverridesV2,
} from '@wormhole-foundation/sdk';

import '@wormhole-foundation/sdk/addresses';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import aptos from '@wormhole-foundation/sdk/aptos';
import sui from '@wormhole-foundation/sdk/sui';
import cosmwasm from '@wormhole-foundation/sdk/cosmwasm';
import algorand from '@wormhole-foundation/sdk/algorand';

export function buildConfig(
  customConfig?: WormholeConnectConfig,
): InternalConfig<NetworkV2> {
  const network = (
    customConfig?.network ||
    customConfig?.env || // TODO remove; deprecated
    import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase() ||
    'mainnet'
  ).toLowerCase() as Network;

  if (!['mainnet', 'testnet', 'devnet'].includes(network))
    throw new Error(`Invalid env "${network}"`);

  const networkData = { MAINNET, DEVNET, TESTNET }[network.toUpperCase()]!;

  const tokens = mergeCustomTokensConfig(
    networkData.tokens,
    customConfig?.tokensConfig,
  );

  const sdkConfig = WormholeContext.getConfig(network);

  const rpcs = Object.assign(
    {},
    sdkConfig.rpcs,
    networkData.rpcs,
    customConfig?.rpcs,
  );

  const wh = getWormholeContext(network, sdkConfig, rpcs);

  if (customConfig?.bridgeDefaults) {
    validateDefaults(customConfig.bridgeDefaults, networkData.chains, tokens);
  }

  const sdkConverter = new SDKConverter(wh);

  return {
    wh,
    sdkConfig,
    sdkConverter,

    v2Network: sdkConverter.toNetworkV2(network),

    network,
    isMainnet: network === 'mainnet',
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
      mainnet: 'https://api.wormholescan.io/',
      testnet: 'https://api.testnet.wormholescan.io/',
      devnet: '',
    }[network],
    wormholeRpcHosts: {
      mainnet: [
        'https://wormhole-v2-mainnet-api.mcf.rocks',
        'https://wormhole-v2-mainnet-api.chainlayer.network',
        'https://wormhole-v2-mainnet-api.staking.fund',
      ],
      testnet: [
        'https://guardian.testnet.xlabs.xyz',
        'https://guardian-01.testnet.xlabs.xyz',
        'https://guardian-02.testnet.xlabs.xyz',
      ],
      devnet: ['http://localhost:7071'],
    }[network],
    coinGeckoApiKey: customConfig?.coinGeckoApiKey,

    // Callbacks
    triggerEvent: wrapEventHandler(customConfig?.eventHandler),
    validateTransfer: customConfig?.validateTransferHandler,

    // White lists
    chains: networkData.chains,
    chainsArr: Object.values(networkData.chains).filter((chain) => {
      return customConfig?.networks
        ? customConfig.networks!.includes(chain.key)
        : true;
    }),
    tokens,
    tokensArr: Object.values(tokens).filter((token) => {
      return customConfig?.tokens
        ? customConfig.tokens!.includes(token.key)
        : true;
    }),

    // For token bridge ^_^
    wrappedTokenAddressCache: new WrappedTokenAddressCache(
      tokens,
      sdkConverter,
    ),

    gasEstimates: networkData.gasEstimates,
    // TODO: disabling all routes except Bridge and Relay until they are fully implemented
    routes: (customConfig?.routes ?? Object.values(Route)).filter((r) =>
      [Route.Bridge, Route.Relay].includes(r as Route),
    ),

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

    // NTT config
    nttGroups: mergeNttGroups(
      tokens,
      networkData.nttGroups,
      customConfig?.nttGroups,
    ),

    // Guardian Set
    guardianSet: networkData.guardianSet,

    // Render Redesign views
    useRedesign: customConfig?.useRedesign,
  };
}

// Running buildConfig with no argument generates the default configuration
const config = buildConfig();
export default config;

// TODO SDKV2: REMOVE
export function getWormholeContext(
  network: Network,
  sdkConfig: WormholeConfig,
  rpcs: ChainResourceMap,
): WormholeContext {
  const wh: WormholeContext = new WormholeContext(network, {
    ...sdkConfig,
    ...{ rpcs },
  });

  return wh;
}

export function getDefaultWormholeContext(network: Network): WormholeContext {
  const sdkConfig = WormholeContext.getConfig(network);
  const networkData = { mainnet: MAINNET, devnet: DEVNET, testnet: TESTNET }[
    network
  ]!;

  const rpcs = Object.assign({}, sdkConfig.rpcs, networkData.rpcs);

  return getWormholeContext(network, sdkConfig, rpcs);
}

export async function getWormholeContextV2(): Promise<WormholeV2<NetworkV2>> {
  if (config.v2Wormhole) return config.v2Wormhole;
  config.v2Wormhole = await newWormholeContextV2();
  return config.v2Wormhole;
}

export async function newWormholeContextV2(): Promise<WormholeV2<NetworkV2>> {
  const v2Config: WormholeConfigOverridesV2<NetworkV2> = { chains: {} };

  for (const key in config.chains) {
    const chainV1 = key as ChainName;
    const chainConfigV1 = config.chains[chainV1]!;

    const chainContextV1 = chainConfigV1.context;

    const chainV2 = config.sdkConverter.toChainV2(
      chainV1 as ChainName,
    ) as ChainV2;

    const rpc = config.rpcs[chainV1];
    const tokenMap: ChainTokensV2 = {};

    for (const token of config.tokensArr) {
      const nativeChainV2 = config.sdkConverter.toChainV2(token.nativeChain);

      const tokenV2: Partial<TokenV2> = {
        key: token.key,
        chain: chainV2,
        symbol: token.symbol,
      };

      if (nativeChainV2 == chainV2) {
        const decimals =
          token.decimals[chainContextV1] ?? token.decimals.default;
        if (!decimals) {
          continue;
        } else {
          tokenV2.decimals = decimals;
        }

        tokenV2.address = token.tokenId?.address ?? 'native';
      } else {
        tokenV2.original = nativeChainV2;
        if (token.foreignAssets) {
          const fa = token.foreignAssets[chainV1]!;

          if (!fa) {
            continue;
          } else {
            tokenV2.address = fa.address;
            tokenV2.decimals = fa.decimals;
          }
        } else {
          continue;
        }
      }

      tokenMap[token.key] = tokenV2 as TokenV2;
    }

    v2Config.chains![chainV2] = { rpc, tokenMap };
  }

  return await getWormholeV2(
    config.v2Network,
    [evm, solana, aptos, cosmwasm, sui, algorand],
    v2Config,
  );
}

// setConfig can be called afterwards to override the default config with integrator-provided config

export function setConfig(customConfig?: WormholeConnectConfig) {
  const newConfig: InternalConfig<NetworkV2> = buildConfig(customConfig);

  // We overwrite keys in the existing object so the references to the config
  // imported elsewhere point to the new values
  for (const key in newConfig) {
    /* @ts-ignore */
    config[key] = newConfig[key];
  }
}

// TODO: add config validation step to buildConfig
//validateConfigs();
