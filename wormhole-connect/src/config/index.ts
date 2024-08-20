import {
  ChainName,
  WormholeContext,
  WormholeConfig,
  ForeignAssetCache,
  ChainResourceMap,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Network as NetworkLegacy } from '@certusone/wormhole-sdk'; // TODO remove
import MAINNET from './mainnet';
import TESTNET from './testnet';
import DEVNET from './devnet';
import type { WormholeConnectConfig } from './types';
import { Network, InternalConfig, Route, TokensConfig } from './types';
import {
  mergeCustomTokensConfig,
  mergeNttGroups,
  validateDefaults,
} from './utils';
import { wrapEventHandler } from './events';

import { SDKConverter } from './converter';

export function buildConfig(
  customConfig?: WormholeConnectConfig,
): InternalConfig {
  const network = (
    customConfig?.network ||
    customConfig?.env || // TODO remove; deprecated
    import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase() ||
    'mainnet'
  ).toLowerCase() as Network;

  if (!['mainnet', 'testnet', 'devnet'].includes(network))
    throw new Error(`Invalid env "${network}"`);

  // TODO remove
  // SDKv1 uses ALLCAPS network consts like "MAINNET"
  // Connect uses lowercase like "mainnet"
  // SDKv2 uses capitalized like "Mainnet"
  // It's a mess
  const networkLegacy = network.toUpperCase() as NetworkLegacy;

  const networkData = { MAINNET, DEVNET, TESTNET }[networkLegacy]!;

  const tokens = mergeCustomTokensConfig(
    networkData.tokens,
    customConfig?.tokensConfig,
  );

  const sdkConfig = WormholeContext.getConfig(networkLegacy);

  const rpcs = Object.assign(
    {},
    sdkConfig.rpcs,
    networkData.rpcs,
    customConfig?.rpcs,
  );

  const wh = getWormholeContext(networkLegacy, sdkConfig, tokens, rpcs);

  if (customConfig?.bridgeDefaults) {
    validateDefaults(customConfig.bridgeDefaults, networkData.chains, tokens);
  }

  const sdkConverter = new SDKConverter(wh);

  return {
    wh,
    sdkConfig,
    sdkConverter,

    // TODO remove either env or network from this
    // some code uses lowercase, some uppercase... :(
    network,
    networkLegacy,
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
    isRouteSupportedHandler: customConfig?.isRouteSupportedHandler,

    // White lists
    chains: networkData.chains,
    chainsArr: !Array.isArray(customConfig?.networks)
      ? Object.values(networkData.chains)
      : customConfig.networks
          .map((chainName) => networkData.chains[chainName]!)
          .filter(Boolean),
    tokens,
    tokensArr: Object.values(tokens).filter((token) => {
      return customConfig?.tokens
        ? customConfig.tokens!.includes(token.key)
        : true;
    }),
    gasEstimates: networkData.gasEstimates,
    routes: customConfig?.routes ?? Object.values(Route),

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
    manualTargetAddress: !!customConfig?.manualTargetAddress,

    // Route options
    ethBridgeMaxAmount: customConfig?.ethBridgeMaxAmount ?? 5,
    wstETHBridgeMaxAmount: customConfig?.wstETHBridgeMaxAmount ?? 5,
    usdtBridgeMaxAmount: customConfig?.usdtBridgeMaxAmount ?? 10_000,

    // NTT config
    nttGroups: mergeNttGroups(
      tokens,
      networkData.nttGroups,
      customConfig?.nttGroups,
    ),

    // Guardian Set
    guardianSet: networkData.guardianSet,
  };
}

// Running buildConfig with no argument generates the default configuration
const config = buildConfig();
export default config;

export function getWormholeContext(
  network: NetworkLegacy,
  sdkConfig: WormholeConfig,
  tokens: TokensConfig,
  rpcs: ChainResourceMap,
): WormholeContext {
  const foreignAssetCache = new ForeignAssetCache();
  for (const { tokenId, foreignAssets } of Object.values(tokens)) {
    if (tokenId && foreignAssets) {
      for (const [foreignChain, { address }] of Object.entries(foreignAssets)) {
        foreignAssetCache.set(
          tokenId.chain,
          tokenId.address,
          foreignChain as ChainName,
          address,
        );
      }
    }
  }

  const wh: WormholeContext = new WormholeContext(
    network,
    {
      ...sdkConfig,
      ...{ rpcs },
    },
    foreignAssetCache,
  );

  return wh;
}

export function getDefaultWormholeContext(network: Network): WormholeContext {
  const networkLegacy: NetworkLegacy = network.toUpperCase() as NetworkLegacy;
  const sdkConfig = WormholeContext.getConfig(networkLegacy);
  const networkData = { MAINNET, DEVNET, TESTNET }[networkLegacy]!;

  const { tokens } = networkData;
  const rpcs = Object.assign({}, sdkConfig.rpcs, networkData.rpcs);

  return getWormholeContext(networkLegacy, sdkConfig, tokens, rpcs);
}

// setConfig can be called afterwards to override the default config with integrator-provided config

export function setConfig(customConfig?: WormholeConnectConfig) {
  const newConfig: InternalConfig = buildConfig(customConfig);

  // We overwrite keys in the existing object so the references to the config
  // imported elsewhere point to the new values
  for (const key in newConfig) {
    /* @ts-ignore */
    config[key] = newConfig[key];
  }
}

// TODO: add config validation step to buildConfig
//validateConfigs();
