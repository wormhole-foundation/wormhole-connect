import {
  WormholeContext,
  MainnetChainName,
  TestnetChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';
import MAINNET from './mainnet';
import TESTNET from './testnet';
import DEVNET from './devnet';
import {
  TokenConfig,
  ChainConfig,
  WormholeConnectConfig,
  Route,
} from './types';
import { dark, light } from '../theme';
import {
  mergeCustomTokensConfig,
  validateConfigs,
  validateDefaults,
} from './utils';
import { Alignment } from 'components/Header';

const el = document.getElementById('wormhole-connect');
if (!el)
  throw new Error('must specify an anchor element with id wormhole-connect');
const configJson = el.getAttribute('config');
export const config: WormholeConnectConfig = JSON.parse(configJson!) || {};

const getEnv = () => {
  const processEnv = import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase();
  if (config.env === 'mainnet' || processEnv === 'mainnet') return 'MAINNET';
  if (config.env === 'devnet' || processEnv === 'devnet') return 'DEVNET';
  return 'TESTNET';
};

const getPageHeader = (): { text: string; align: Alignment } => {
  const defaults: { text: string; align: Alignment } = {
    text: '',
    align: 'left',
  };
  if (typeof config.pageHeader === 'string') {
    return { ...defaults, text: config.pageHeader };
  } else {
    return { ...defaults, ...config.pageHeader };
  }
};

export const ENV = getEnv();
export const isMainnet = ENV === 'MAINNET';
export const sdkConfig = WormholeContext.getConfig(ENV);
export const showHamburgerMenu =
  config.showHamburgerMenu === undefined || config.showHamburgerMenu === true;
export const pageHeader = getPageHeader();
export const partnerLogo = config.partnerLogo;

export const WORMSCAN = 'https://wormholescan.io/#/';
export const WORMHOLE_API =
  ENV === 'MAINNET'
    ? 'https://api.wormholescan.io/'
    : ENV === 'DEVNET'
    ? ''
    : 'https://api.testnet.wormholescan.io/';

export const EXPLORER = config.explorer;

export const ATTEST_URL = {
  MAINNET: 'https://portalbridge.com/advanced-tools/#/register',
  DEVNET: '',
  TESTNET:
    'https://wormhole-foundation.github.io/example-token-bridge-ui/#/register',
}[ENV];

export const USDC_BRIDGE_URL = config.cctpWarning?.href || '';

export const COINGECKO_API_KEY = config.coinGeckoApiKey;

export const WORMHOLE_RPC_HOSTS = {
  MAINNET: [
    'https://wormhole-v2-mainnet-api.mcf.rocks',
    'https://wormhole-v2-mainnet-api.chainlayer.network',
    'https://wormhole-v2-mainnet-api.staking.fund',
  ],
  TESTNET: [
    'https://guardian.testnet.xlabs.xyz',
    'https://guardian-01.testnet.xlabs.xyz',
    'https://guardian-02.testnet.xlabs.xyz',
  ],
  DEVNET: ['http://localhost:7071'],
}[ENV];

export const NETWORK_DATA = { MAINNET, DEVNET, TESTNET }[ENV];

export const CHAINS = NETWORK_DATA.chains;
export const CHAINS_ARR =
  config && config.networks
    ? Object.values(CHAINS).filter((c) => config.networks!.includes(c.key))
    : (Object.values(CHAINS) as ChainConfig[]);

export const SEARCH_TX = config && config.searchTx;

export const AVAILABLE_MARKETS_URL =
  'https://portalbridge.com/docs/faqs/liquid-markets/';

export const MORE_NETWORKS = config && config.moreNetworks;
export const MORE_TOKENS = config && config.moreTokens;
export const TOKENS = mergeCustomTokensConfig(
  NETWORK_DATA.tokens,
  config.tokensConfig,
);
export const TOKENS_ARR =
  config && config.tokens
    ? Object.values(TOKENS).filter((c) => config.tokens!.includes(c.key))
    : (Object.values(TOKENS) as TokenConfig[]);

export const MENU_ENTRIES = config.menu || [];

export const ROUTES =
  config && config.routes ? config.routes : Object.values(Route);

export const RPCS =
  config && config.rpcs
    ? Object.assign({}, sdkConfig.rpcs, NETWORK_DATA.rpcs, config.rpcs)
    : Object.assign({}, sdkConfig.rpcs, NETWORK_DATA.rpcs);

export const REST =
  config && config.rest
    ? Object.assign({}, sdkConfig.rest, NETWORK_DATA.rest, config.rest)
    : Object.assign({}, sdkConfig.rest, NETWORK_DATA.rest);

export const GRAPHQL =
  config && config.graphql
    ? Object.assign({}, NETWORK_DATA.graphql, config.graphql)
    : NETWORK_DATA.graphql;

export const GAS_ESTIMATES = NETWORK_DATA.gasEstimates;

export const THEME_MODE = config && config.mode ? config.mode : 'dark';
export const CUSTOM_THEME = config && config.customTheme;
const BASE_THEME = THEME_MODE === 'dark' ? dark : light;
export const THEME = CUSTOM_THEME
  ? Object.assign({}, BASE_THEME, CUSTOM_THEME)
  : BASE_THEME;

export const CTA = config && config.cta;
export const BRIDGE_DEFAULTS =
  config && validateDefaults(config.bridgeDefaults);

export const WALLET_CONNECT_PROJECT_ID =
  config && config.walletConnectProjectId
    ? config.walletConnectProjectId
    : import.meta.env.REACT_APP_WALLET_CONNECT_PROJECT_ID;

export const ethBridgeMaxAmount = config?.ethBridgeMaxAmount ?? 5;
export const wstETHBridgeMaxAmount = config?.wstETHBridgeMaxAmount ?? 2.5;

export const TESTNET_TO_MAINNET_CHAIN_NAMES: {
  [k in TestnetChainName]: MainnetChainName;
} = {
  goerli: 'ethereum',
  fuji: 'avalanche',
  mumbai: 'polygon',
  alfajores: 'celo',
  moonbasealpha: 'moonbeam',
  solana: 'solana',
  bsc: 'bsc',
  fantom: 'fantom',
  sui: 'sui',
  aptos: 'aptos',
  arbitrumgoerli: 'arbitrum',
  optimismgoerli: 'optimism',
  basegoerli: 'base',
  sei: 'sei',
  wormchain: 'wormchain',
  osmosis: 'osmosis',
  cosmoshub: 'cosmoshub',
  evmos: 'evmos',
  kujira: 'kujira',
  klaytn: 'klaytn',
  sepolia: 'ethereum',
  arbitrum_sepolia: 'arbitrum',
  base_sepolia: 'base',
  optimism_sepolia: 'optimism',
};

validateConfigs();
