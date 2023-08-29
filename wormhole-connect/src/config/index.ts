import {
  WormholeContext,
  CONFIG as CONF,
} from '@wormhole-foundation/wormhole-connect-sdk';
import {
  MAINNET_NETWORKS,
  MAINNET_TOKENS,
  MAINNET_GAS_ESTIMATES,
} from './mainnet';
import {
  TESTNET_NETWORKS,
  TESTNET_TOKENS,
  TESTNET_GAS_ESTIMATES,
} from './testnet';
import { TokenConfig, NetworkConfig, WormholeConnectConfig } from './types';
import { dark, light } from '../theme';
import {
  MainnetChainName,
  TestnetChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { validateChainResources, validateDefaults } from './utils';
import { DEVNET_GAS_ESTIMATES, DEVNET_NETWORKS, DEVNET_TOKENS } from './devnet';

const el = document.getElementById('wormhole-connect');
if (!el)
  throw new Error('must specify an anchor element with id wormhole-connect');
const configJson = el.getAttribute('config');
export const config: WormholeConnectConfig | null = JSON.parse(configJson!);

const getEnv = () => {
  if (!config) return 'TESTNET';
  if (config.env === 'mainnet') return 'MAINNET';
  if (config.env === 'devnet') return 'DEVNET';
  return 'TESTNET';
};

export const ENV = getEnv();
export const isMainnet = ENV === 'MAINNET';
export const CONFIG =
  ENV === 'MAINNET'
    ? CONF.MAINNET
    : ENV === 'DEVNET'
    ? CONF.DEVNET
    : CONF.TESTNET;

export const WORMSCAN = 'https://wormholescan.io/#/';
export const WORMHOLE_API =
  ENV === 'MAINNET'
    ? 'https://api.wormholescan.io/'
    : ENV === 'DEVNET'
    ? ''
    : 'https://api.testnet.wormholescan.io/';

export const ATTEST_URL =
  ENV === 'MAINNET'
    ? 'https://www.portalbridge.com/#/register'
    : ENV === 'DEVNET'
    ? ''
    : 'https://wormhole-foundation.github.io/example-token-bridge-ui/#/register';

export const CHAINS =
  ENV === 'MAINNET'
    ? MAINNET_NETWORKS
    : ENV === 'DEVNET'
    ? DEVNET_NETWORKS
    : TESTNET_NETWORKS;

export const CHAINS_ARR =
  config && config.networks
    ? Object.values(CHAINS).filter((c) => config.networks!.includes(c.key))
    : (Object.values(CHAINS) as NetworkConfig[]);

export const TOKENS =
  ENV === 'MAINNET'
    ? MAINNET_TOKENS
    : ENV === 'DEVNET'
    ? DEVNET_TOKENS
    : TESTNET_TOKENS;
export const TOKENS_ARR =
  config && config.tokens
    ? Object.values(TOKENS).filter((c) => config.tokens!.includes(c.key))
    : (Object.values(TOKENS) as TokenConfig[]);

validateChainResources();

const conf = WormholeContext.getConfig(CONFIG.env);
const mainnetRpcs = {
  ethereum: process.env.REACT_APP_ETHEREUM_RPC || conf.rpcs.ethereum,
  solana: process.env.REACT_APP_SOLANA_RPC || conf.rpcs.solana,
  polygon: process.env.REACT_APP_POLYGON_RPC || conf.rpcs.polygon,
  bsc: process.env.REACT_APP_BSC_RPC || conf.rpcs.bsc,
  avalanche: process.env.REACT_APP_AVALANCHE_RPC || conf.rpcs.avalanche,
  fantom: process.env.REACT_APP_FANTOM_RPC || conf.rpcs.fantom,
  celo: process.env.REACT_APP_CELO_RPC || conf.rpcs.celo,
  moonbeam: process.env.REACT_APP_MOONBEAM_RPC || conf.rpcs.moonbeam,
  sui: process.env.REACT_APP_SUI_RPC || conf.rpcs.sui,
  aptos: process.env.REACT_APP_APTOS_RPC || conf.rpcs.aptos,
  sei: process.env.REACT_APP_SEI_RPC || conf.rpcs.sei,
  base: process.env.REACT_APP_BASE_RPC || conf.rpcs.base,
  osmosis: process.env.REACT_APP_OSMOSIS_RPC || conf.rpcs.osmosis,
  wormchain: process.env.REACT_APP_WORMCHAIN_RPC || conf.rpcs.wormchain,
};
const testnetRpcs = {
  goerli: process.env.REACT_APP_GOERLI_RPC || conf.rpcs.goerli,
  mumbai: process.env.REACT_APP_MUMBAI_RPC || conf.rpcs.mumbai,
  bsc: process.env.REACT_APP_BSC_TESTNET_RPC || conf.rpcs.bsc,
  fuji: process.env.REACT_APP_FUJI_RPC || conf.rpcs.fuji,
  fantom: process.env.REACT_APP_FANTOM_TESTNET_RPC || conf.rpcs.fantom,
  alfajores: process.env.REACT_APP_ALFAJORES_RPC || conf.rpcs.alfajores,
  solana: process.env.REACT_APP_SOLANA_DEVNET_RPC || conf.rpcs.solana,
  moonbasealpha: process.env.REACT_APP_MOONBASE_RPC || conf.rpcs.moonbasealpha,
  sui: process.env.REACT_APP_SUI_TESTNET_RPC || conf.rpcs.sui,
  aptos: process.env.REACT_APP_APTOS_TESTNET_RPC || conf.rpcs.aptos,
  sei: process.env.REACT_APP_SEI_TESTNET_RPC || conf.rpcs.sei,
  basegoerli: process.env.REACT_APP_BASE_GOERLI_RPC || conf.rpcs.basegoerli,
  osmosis: process.env.REACT_APP_OSMOSIS_TESTNET_RPC || conf.rpcs.osmosis,
  wormchain: process.env.REACT_APP_WORMCHAIN_TESTNET_RPC || conf.rpcs.wormchain,
};
const devnetRpcs = {
  ethereum: process.env.REACT_APP_ETHEREUM_DEVNET_RPC || conf.rpcs.ethereum,
  osmosis: process.env.REACT_APP_OSMOSIS_DEVNET_RPC || conf.rpcs.osmosis,
  wormchain: process.env.REACT_APP_WORMCHAIN_DEVNET_RPC || conf.rpcs.wormchain,
  terra2: process.env.REACT_APP_TERRA2_DEVNET_RPC || conf.rpcs.terra2,
};
conf.rpcs = Object.assign(
  {},
  ENV === 'MAINNET' ? mainnetRpcs : ENV === 'DEVNET' ? devnetRpcs : testnetRpcs,
  config?.rpcs || {},
);

const mainnetRest = {
  sei: process.env.REACT_APP_SEI_REST || conf.rest.sei,
};
const testnetRest = {
  sei: process.env.REACT_APP_SEI_REST || conf.rest.sei,
};
const devnetRest = {
  sei: process.env.REACT_APP_SEI_REST || conf.rest.sei,
};
conf.rest = Object.assign(
  {},

  ENV === 'MAINNET' ? mainnetRest : ENV === 'DEVNET' ? devnetRest : testnetRest,
  config?.rest || {},
);
export const WH_CONFIG = conf;

export const GAS_ESTIMATES =
  ENV === 'MAINNET'
    ? MAINNET_GAS_ESTIMATES
    : ENV === 'DEVNET'
    ? DEVNET_GAS_ESTIMATES
    : TESTNET_GAS_ESTIMATES;

export const THEME_MODE = config && config.mode ? config.mode : 'dark';
export const CUSTOM_THEME = config && config.customTheme;
const BASE_THEME = THEME_MODE === 'dark' ? dark : light;
export const THEME = CUSTOM_THEME
  ? Object.assign({}, BASE_THEME, CUSTOM_THEME)
  : BASE_THEME;

export const CTA = config && config.cta;
export const BRIDGE_DEFAULTS =
  config && validateDefaults(config.bridgeDefaults);

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
  basegoerli: 'base',
  sei: 'sei',
  wormchain: 'wormchain',
  osmosis: 'osmosis',
};
