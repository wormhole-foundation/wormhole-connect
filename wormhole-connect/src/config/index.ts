import { Network as Environment } from '@certusone/wormhole-sdk';
import {
  WormholeContext,
  CONFIG as CONF,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { MAINNET_NETWORKS, MAINNET_TOKENS } from './mainnet';
import { TESTNET_NETWORKS, TESTNET_TOKENS } from './testnet';
import { TokenConfig, NetworkConfig, WormholeConnectConfig } from './types';
import { dark, light } from '../theme';
import {
  MainnetChainName,
  TestnetChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';

const el = document.getElementById('wormhole-connect');
if (!el)
  throw new Error('must specify an anchor element with id wormhole-connect');
const configJson = el.getAttribute('config');
const config: WormholeConnectConfig | null = JSON.parse(configJson!);

const { REACT_APP_ENV } = process.env;
export const isProduction = REACT_APP_ENV === 'MAINNET';
export const CONFIG = isProduction ? CONF.MAINNET : CONF.TESTNET;

const conf = WormholeContext.getConfig(REACT_APP_ENV! as Environment);
const mainnetRpcs = {
  ethereum: process.env.REACT_APP_ETHEREUM_RPC || conf.rpcs.ethereum,
  solana: process.env.REACT_APP_SOLANA_RPC || conf.rpcs.solana,
  polygon: process.env.REACT_APP_POLYGON_RPC || conf.rpcs.polygon,
  bsc: process.env.REACT_APP_BSC_RPC || conf.rpcs.bsc,
  avalanche: process.env.REACT_APP_AVALANCHE_RPC || conf.rpcs.avalanche,
  fantom: process.env.REACT_APP_FANTOM_RPC || conf.rpcs.fantom,
  celo: process.env.REACT_APP_CELO_RPC || conf.rpcs.celo,
  moonbeam: process.env.REACT_APP_MOONBEAM_RPC || conf.rpcs.moonbeam,
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
};
conf.rpcs = Object.assign(
  {},
  REACT_APP_ENV === 'MAINNET' ? mainnetRpcs : testnetRpcs,
  config?.rpcs || {},
);
export const WH_CONFIG = conf;

export const CHAINS = isProduction ? MAINNET_NETWORKS : TESTNET_NETWORKS;
export const CHAINS_ARR =
  config && config.networks
    ? Object.values(CHAINS).filter((c) => config.networks!.includes(c.key))
    : (Object.values(CHAINS) as NetworkConfig[]);

export const TOKENS = isProduction ? MAINNET_TOKENS : TESTNET_TOKENS;
export const TOKENS_ARR =
  config && config.tokens
    ? Object.values(TOKENS).filter((c) => config.tokens!.includes(c.symbol))
    : (Object.values(TOKENS) as TokenConfig[]);

export const THEME_MODE = config && config.mode ? config.mode : 'dark';
export const CUSTOM_THEME = config && config.customTheme;
export const THEME = CUSTOM_THEME || THEME_MODE === 'dark' ? dark : light;

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
};
