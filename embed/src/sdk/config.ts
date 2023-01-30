import { ChainConfig } from 'sdk';
import { CONFIG as CONF } from 'sdk';
import { MAINNET_NETWORKS, MAINNET_TOKENS } from '../config/mainnet';
import { TESTNET_NETWORKS, TESTNET_TOKENS } from '../config/testnet';
import { TokenConfig } from 'config/types';

const el = document.getElementById('wormhole-connect');
if (!el)
  throw new Error('must specify an anchor element with id wormhole-connect');
const configJson = el.getAttribute('config');
const config = JSON.parse(configJson!);
console.log('CONFIG', config);

const { REACT_APP_ENV } = process.env;
export const isProduction = REACT_APP_ENV === 'MAINNET';
export const CONFIG = isProduction ? CONF.MAINNET : CONF.TESTNET;
export const CHAINS = isProduction ? MAINNET_NETWORKS : TESTNET_NETWORKS;
export const CHAINS_ARR = config.networks
  ? (Object.values(CHAINS) as ChainConfig[]).filter(
      (c) => config.networks.indexOf(c.key) >= 0,
    )
  : (Object.values(CHAINS) as ChainConfig[]);
export const TOKENS = isProduction ? MAINNET_TOKENS : TESTNET_TOKENS;
export const TOKENS_ARR = config.tokens
  ? (Object.values(TOKENS) as TokenConfig[]).filter(
      (c) => config.tokens.indexOf(c.symbol) >= 0,
    )
  : (Object.values(TOKENS) as TokenConfig[]);
export const REQUIRED_CONFIRMATIONS = isProduction ? 13 : 1;
export const THEME = config.theme || 'light';
