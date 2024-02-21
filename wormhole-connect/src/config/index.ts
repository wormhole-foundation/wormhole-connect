import {
  ChainName,
  WormholeContext,
  WormholeConfig,
  ForeignAssetCache,
  ChainResourceMap,
} from '@wormhole-foundation/wormhole-connect-sdk';
import MAINNET from './mainnet';
import TESTNET from './testnet';
import DEVNET from './devnet';
import {
  Environment,
  WormholeConnectConfig,
  Route,
  IntegrationConfig,
  TokensConfig,
} from './types';
import { mergeCustomTokensConfig, validateDefaults } from './utils';

type Network = 'MAINNET' | 'TESTNET' | 'DEVNET';

export function buildConfig(
  customConfig?: IntegrationConfig,
): WormholeConnectConfig {
  const env = (customConfig?.env ||
    import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase() ||
    'testnet') as Environment;

  if (!['mainnet', 'testnet', 'devnet'].includes(env))
    throw new Error(`Invalid env "${env}"`);

  const network: Network = env.toUpperCase() as Network;

  const networkData = { MAINNET, DEVNET, TESTNET }[network];

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

  const wh = getWormholeContext(network, sdkConfig, tokens, rpcs);

  return {
    wh,
    sdkConfig,

    // TODO remove either env or network from this
    // some code uses lowercase, some uppercase... :(
    env,
    network,
    isMainnet: env === 'mainnet',
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
    }[env],
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
    }[env],
    coinGeckoApiKey: customConfig?.coinGeckoApiKey,

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
    }[env],
    bridgeDefaults: validateDefaults(customConfig?.bridgeDefaults),
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

    // Route options
    ethBridgeMaxAmount: customConfig?.ethBridgeMaxAmount ?? 5,
    wstETHBridgeMaxAmount: customConfig?.wstETHBridgeMaxAmount ?? 5,
  };
}

// Running buildConfig with no argument generates the default configuration
const config = buildConfig();
export default config;

function getWormholeContext(
  network: Network,
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

// setConfig can be called afterwards to override the default config with integrator-provided config

export function setConfig(customConfig?: IntegrationConfig) {
  const newConfig: WormholeConnectConfig = buildConfig(customConfig);

  // We overwrite keys in the existing object so the references to the config
  // imported elsewhere point to the new values
  for (const key in newConfig) {
    /* @ts-ignore */
    config[key] = newConfig[key];
  }
}

// TODO: add config validation step to buildConfig
//validateConfigs();
