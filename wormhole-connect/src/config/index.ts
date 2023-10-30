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
import { dark, light } from 'theme';
import { validateConfigs, validateDefaults } from './utils';

const el = document.getElementById('wormhole-connect');
if (!el)
  throw new Error('must specify an anchor element with id wormhole-connect');
const configJson = el.getAttribute('config');
export const config: WormholeConnectConfig = JSON.parse(configJson!) || {
  moreTokens: {
    label: 'More Tokens',
    href: 'portalbridge.com',
  },
  extraNetworks: {
    label: 'Extra Networks',
    href: 'portalbridge.com',
    description:
      'You will leave this site and be redirected to the Portal Token Bridge to continue your operation.',
    networks: [
      {
        name: 'algorand',
        icon: "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg viewBox='532.3494 45.7309 238.36 238.72' width='238.36' height='238.72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='lINT7W' transform='matrix(1, 0, 0, 1, 326.5293884277344, -159.9090576171875)'%3E%3Cpolygon class='cls-1' points='444.18 444.32 406.81 444.32 382.54 354.04 330.36 444.33 288.64 444.33 369.29 304.57 356.31 256.05 247.56 444.36 205.82 444.36 343.64 205.64 380.18 205.64 396.18 264.95 433.88 264.95 408.14 309.71 444.18 444.32' style='fill: rgb(255, 255, 255);'/%3E%3C/g%3E%3C/svg%3E",
        label: 'Algorand',
      },
      {
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='91' height='91' viewBox='0 0 91 91' fill='none'%3E%3Ccircle cx='45.5' cy='45.5' r='45.5' fill='%23E8E8EC'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M26.833 25.8333C26.2807 25.8333 25.833 26.281 25.833 26.8333V63.1666C25.833 63.7189 26.2807 64.1666 26.833 64.1666H63.1663C63.7186 64.1666 64.1663 63.7189 64.1663 63.1666V48.7333C64.1663 48.4571 63.9425 48.2333 63.6663 48.2333C63.3902 48.2333 63.1663 48.4571 63.1663 48.7333V63.1666H26.833V26.8333L41.2663 26.8333C41.5425 26.8333 41.7663 26.6094 41.7663 26.3333C41.7663 26.0571 41.5425 25.8333 41.2663 25.8333H26.833ZM64.0199 25.9797C64.0321 25.9919 64.0435 26.0046 64.0542 26.0177L64.1663 26.324L64.1663 26.3342V37.5333C64.1663 37.8094 63.9425 38.0333 63.6663 38.0333C63.3902 38.0333 63.1663 37.8094 63.1663 37.5333V27.5404L41.6199 49.0868C41.4246 49.2821 41.1081 49.2821 40.9128 49.0868C40.7175 48.8915 40.7175 48.575 40.9128 48.3797L62.4592 26.8333H52.4663C52.1902 26.8333 51.9663 26.6094 51.9663 26.3333C51.9663 26.0571 52.1902 25.8333 52.4663 25.8333H63.666H63.6663C63.6823 25.8333 63.6983 25.834 63.7143 25.8355C63.7632 25.8402 63.8116 25.8521 63.8577 25.8712C63.9167 25.8956 63.972 25.9318 64.0199 25.9797Z' fill='%230F1022'/%3E%3Cpath d='M63.1663 63.1666V64.1666H64.1663V63.1666H63.1663ZM26.833 63.1666H25.833V64.1666H26.833V63.1666ZM26.833 26.8333L26.833 25.8333L25.833 25.8333V26.8333H26.833ZM41.2663 26.8333L41.2663 25.8333H41.2663L41.2663 26.8333ZM64.0542 26.0177L64.9934 25.6742L64.9356 25.5161L64.8292 25.3857L64.0542 26.0177ZM64.0199 25.9797L64.727 25.2726L64.727 25.2726L64.0199 25.9797ZM64.1663 26.324L65.1662 26.3158L65.1648 26.1429L65.1054 25.9806L64.1663 26.324ZM64.1663 26.3342L65.1664 26.3342L65.1663 26.326L64.1663 26.3342ZM63.1663 27.5404H64.1663V25.1261L62.4592 26.8333L63.1663 27.5404ZM40.9128 49.0868L40.2057 49.7939L40.2057 49.7939L40.9128 49.0868ZM40.9128 48.3797L40.2057 47.6726L40.2057 47.6726L40.9128 48.3797ZM62.4592 26.8333L63.1663 27.5404L64.8734 25.8333H62.4592V26.8333ZM63.7143 25.8355L63.8096 24.8401L63.8095 24.8401L63.7143 25.8355ZM63.8577 25.8712L64.2401 24.9472L64.24 24.9472L63.8577 25.8712ZM26.833 26.8333V26.8333V24.8333C25.7284 24.8333 24.833 25.7287 24.833 26.8333H26.833ZM26.833 63.1666V26.8333H24.833V63.1666H26.833ZM26.833 63.1666H26.833H24.833C24.833 64.2712 25.7284 65.1666 26.833 65.1666V63.1666ZM63.1663 63.1666H26.833V65.1666H63.1663V63.1666ZM63.1663 63.1666V65.1666C64.2709 65.1666 65.1663 64.2712 65.1663 63.1666H63.1663ZM63.1663 48.7333V63.1666H65.1663V48.7333H63.1663ZM63.6663 49.2333C63.3902 49.2333 63.1663 49.0094 63.1663 48.7333H65.1663C65.1663 47.9048 64.4948 47.2333 63.6663 47.2333V49.2333ZM64.1663 48.7333C64.1663 49.0094 63.9425 49.2333 63.6663 49.2333V47.2333C62.8379 47.2333 62.1663 47.9048 62.1663 48.7333H64.1663ZM64.1663 63.1666V48.7333H62.1663V63.1666H64.1663ZM26.833 64.1666H63.1663V62.1666H26.833V64.1666ZM25.833 26.8333V63.1666H27.833V26.8333H25.833ZM41.2663 25.8333L26.833 25.8333L26.833 27.8333L41.2663 27.8333L41.2663 25.8333ZM40.7663 26.3333C40.7663 26.0571 40.9902 25.8333 41.2663 25.8333V27.8333C42.0948 27.8333 42.7663 27.1617 42.7663 26.3333H40.7663ZM41.2663 26.8333C40.9902 26.8333 40.7663 26.6094 40.7663 26.3333H42.7663C42.7663 25.5048 42.0948 24.8333 41.2663 24.8333V26.8333ZM26.833 26.8333H41.2663V24.8333H26.833V26.8333ZM64.8292 25.3857C64.7971 25.3464 64.763 25.3086 64.727 25.2726L63.3128 26.6868C63.3012 26.6752 63.2899 26.6628 63.2793 26.6497L64.8292 25.3857ZM65.1054 25.9806L64.9934 25.6742L63.1151 26.3611L63.2271 26.6675L65.1054 25.9806ZM65.1663 26.326L65.1662 26.3158L63.1663 26.3322L63.1664 26.3425L65.1663 26.326ZM65.1663 37.5333V26.3342H63.1663V37.5333H65.1663ZM63.6663 39.0333C64.4948 39.0333 65.1663 38.3617 65.1663 37.5333H63.1663C63.1663 37.2571 63.3902 37.0333 63.6663 37.0333V39.0333ZM62.1663 37.5333C62.1663 38.3617 62.8379 39.0333 63.6663 39.0333V37.0333C63.9425 37.0333 64.1663 37.2571 64.1663 37.5333H62.1663ZM62.1663 27.5404V37.5333H64.1663V27.5404H62.1663ZM42.327 49.7939L63.8734 28.2475L62.4592 26.8333L40.9128 48.3797L42.327 49.7939ZM40.2057 49.7939C40.7915 50.3797 41.7412 50.3797 42.327 49.7939L40.9128 48.3797C41.108 48.1844 41.4246 48.1844 41.6199 48.3797L40.2057 49.7939ZM40.2057 47.6726C39.6199 48.2584 39.6199 49.2081 40.2057 49.7939L41.6199 48.3797C41.8152 48.575 41.8152 48.8915 41.6199 49.0868L40.2057 47.6726ZM61.7521 26.1261L40.2057 47.6726L41.6199 49.0868L63.1663 27.5404L61.7521 26.1261ZM52.4663 27.8333H62.4592V25.8333H52.4663V27.8333ZM50.9663 26.3333C50.9663 27.1617 51.6379 27.8333 52.4663 27.8333V25.8333C52.7425 25.8333 52.9663 26.0571 52.9663 26.3333H50.9663ZM52.4663 24.8333C51.6379 24.8333 50.9663 25.5048 50.9663 26.3333H52.9663C52.9663 26.6094 52.7425 26.8333 52.4663 26.8333V24.8333ZM63.666 24.8333H52.4663V26.8333H63.666V24.8333ZM63.6663 24.8333H63.666V26.8333H63.6663V24.8333ZM63.8095 24.8401C63.7619 24.8355 63.7141 24.8333 63.6663 24.8333V26.8333C63.6505 26.8333 63.6347 26.8325 63.619 26.831L63.8095 24.8401ZM64.24 24.9472C64.1011 24.8897 63.9559 24.8541 63.8096 24.8401L63.619 26.831C63.5706 26.8264 63.5221 26.8146 63.4754 26.7952L64.24 24.9472ZM64.727 25.2726C64.5845 25.1301 64.4184 25.0209 64.2401 24.9472L63.4754 26.7952C63.4151 26.7702 63.3594 26.7334 63.3128 26.6868L64.727 25.2726Z' fill='%230F1022'/%3E%3C/svg%3E",
        name: 'more',
        label: 'More networks',
        href: `_/#/transfer`,
        showOpenInNewIcon: false,
      },
    ],
  },
};

const getEnv = () => {
  const processEnv = process.env.REACT_APP_CONNECT_ENV?.toLowerCase();
  if (config.env === 'mainnet' || processEnv === 'mainnet') return 'MAINNET';
  if (config.env === 'devnet' || processEnv === 'devnet') return 'DEVNET';
  return 'TESTNET';
};

export const ENV = getEnv();
export const isMainnet = ENV === 'MAINNET';
export const sdkConfig = WormholeContext.getConfig(ENV);
export const showHamburgerMenu =
  config.showHamburgerMenu === undefined || config.showHamburgerMenu === true;
export const pageHeader =
  config.pageHeader === undefined ? '' : config.pageHeader;

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

export const WORMHOLE_RPC_HOSTS =
  ENV === 'MAINNET'
    ? [
        'https://wormhole-v2-mainnet-api.certus.one',
        'https://wormhole.inotel.ro',
        'https://wormhole-v2-mainnet-api.mcf.rocks',
        'https://wormhole-v2-mainnet-api.chainlayer.network',
        'https://wormhole-v2-mainnet-api.staking.fund',
        'https://wormhole-v2-mainnet.01node.com',
      ]
    : ENV === 'TESTNET'
    ? ['https://wormhole-v2-testnet-api.certus.one']
    : ['http://localhost:7071'];

export const NETWORK_DATA =
  ENV === 'MAINNET' ? MAINNET : ENV === 'DEVNET' ? DEVNET : TESTNET;

export const CHAINS = NETWORK_DATA.chains;
export const CHAINS_ARR =
  config && config.networks
    ? Object.values(CHAINS).filter((c) => config.networks!.includes(c.key))
    : (Object.values(CHAINS) as ChainConfig[]);

export const SEARCH_TX = config && config.searchTx;

export const EXTRA_NETWOKS = config && config.extraNetworks;
export const MORE_TOKENS = config && config.moreTokens;
export const TOKENS = NETWORK_DATA.tokens;
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
};

validateConfigs();
