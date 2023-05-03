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
import { validateDefaults } from './utils';

const el = document.getElementById('wormhole-connect');
if (!el)
  throw new Error('must specify an anchor element with id wormhole-connect');
const configJson = el.getAttribute('config');
export const config: WormholeConnectConfig | null = JSON.parse(configJson!);

export const isMainnet = config && config.env === 'mainnet';
export const CONFIG = isMainnet ? CONF.MAINNET : CONF.TESTNET;
export const ENV = isMainnet ? 'MAINNET' : 'TESTNET';

export const WORMHOLE_EXPLORER = 'https://wormhole.com/explorer/';
export const WORMHOLE_API = isMainnet
  ? 'https://api.wormscan.io/'
  : 'https://api.testnet.wormscan.io/';
export const ATTEST_URL = isMainnet
  ? 'https://www.portalbridge.com/#/register'
  : 'https://wormhole-foundation.github.io/example-token-bridge-ui/#/register';

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
  sui: process.env.REACT_APP_SUI_RPC || conf.rpcs.sui,
};
conf.rpcs = Object.assign(
  {},
  isMainnet ? mainnetRpcs : testnetRpcs,
  config?.rpcs || {},
);
export const WH_CONFIG = conf;

export const CHAINS = isMainnet ? MAINNET_NETWORKS : TESTNET_NETWORKS;
export const CHAINS_ARR =
  config && config.networks
    ? Object.values(CHAINS).filter((c) => config.networks!.includes(c.key))
    : (Object.values(CHAINS) as NetworkConfig[]);

export const TOKENS = isMainnet ? MAINNET_TOKENS : TESTNET_TOKENS;
export const TOKENS_ARR =
  config && config.tokens
    ? Object.values(TOKENS).filter((c) => config.tokens!.includes(c.key))
    : (Object.values(TOKENS) as TokenConfig[]);

export const GAS_ESTIMATES = isMainnet
  ? MAINNET_GAS_ESTIMATES
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
};
