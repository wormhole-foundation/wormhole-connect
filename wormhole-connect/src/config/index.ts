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
  moreNetworks: {
    href: `/advance-tools/#/transfer?sourceChain={:sourceChain}&targetChain={:targetChain}`,
    target: '_blank',
    description:
      'brief description that should be displayed as tooltip when the user over an more network icon',
    networks: [
      {
        icon: "data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cmask id='mask0_5964_23764' style='mask-type:alpha' maskUnits='userSpaceOnUse' x='0' y='0' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23D9D9D9'/%3E%3C/mask%3E%3Cg mask='url(%23mask0_5964_23764)'%3E%3Cpath d='M17.1382 72.7516L27.3034 55.1578L37.4598 37.6258L47.5588 20.032L49.2361 17.2424L49.9732 20.032L53.0718 31.6141L49.6024 37.6258L39.4461 55.1578L29.3471 72.7516H41.4853L51.6461 55.1578L56.9118 46.0519L59.3925 55.1578L64.0977 72.7516H75L70.2948 55.1578L65.5852 37.6258L64.3493 33.1015L71.9059 20.032H60.8799L60.5048 18.7299L56.6647 4.35825L56.1703 2.5H45.577L45.3298 2.87077L35.4162 20.032L25.2554 37.6258L15.1608 55.1578L5 72.7516H17.1382Z' fill='white'/%3E%3C/g%3E%3C/svg%3E%0A",
        name: 'algorand',
        label: 'Algorand',
      },
      {
        icon: "data:image/svg+xml,%3Csvg fill='none' viewBox='0 0 490 490' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M245 490c135.31 0 245-109.69 245-245S380.31 0 245 0 0 109.69 0 245s109.69 245 245 245zm1-23c122.61 0 222-99.393 222-222S368.607 23 246 23 24 122.393 24 245s99.393 222 222 222zm-1-17c113.22 0 205-91.782 205-205S358.218 40 245 40 40 131.782 40 245s91.782 205 205 205zm.5-25c99.687 0 180.5-80.813 180.5-180.5S345.187 64 245.5 64 65 144.813 65 244.5 145.813 425 245.5 425zM235.313 98.66l130.68 226.7 14.012-24.31-116.66-202.39zm-125.31 201.98 111.84-194.03.231.4.22-.382 132.54 229.93h-28.025l-33.484-58.088c-15.215-4.81-31.414-7.404-48.22-7.404-8.663 0-17.117.605-25.336 1.812l16.14-27.956c3.047-.149 6.113-.224 9.196-.224 10.267 0 20.339.831 30.154 2.43l-53.195-92.284-98.05 170.1zm76.035-2.949 50.256-87.186-14.012-24.309-86.676 150.37h28.025l.266-.462c24.037-14.472 51.619-21.787 81.737-21.787 19.232 0 37.67 3.397 54.747 9.625l-18.775-32.52a187.14 187.14 0 0 0-35.972-3.472c-20.842 0-40.885 3.425-59.596 9.744z' clip-rule='evenodd' fill='url(%23a)' fill-rule='evenodd'/%3E%3Cdefs%3E%3ClinearGradient id='a' x1='462.5' x2='101' y1='490' y2='43.5' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%235A81FF' offset='0'/%3E%3Cstop stop-color='%23E40C5B' offset='.524'/%3E%3Cstop stop-color='%23FF4C3B' offset='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E",
        name: 'acala',
        label: 'Acala',
      },
      {
        icon: "data:image/svg+xml,%3Csvg width='256' height='256' viewBox='0 0 256 256' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m 127.67411,256 c 38.02499,0 72.18784,-16.49691 95.68658,-42.70676 -10.93123,-9.47577 -27.40461,-10.05162 -39.04159,-0.68556 l -2.22314,1.78953 c -21.30703,17.14908 -52.35448,14.61676 -70.58505,-5.7577 -9.94332,-11.11197 -26.972141,-12.24661 -38.308517,-2.55277 L 47.570215,228.00608 C 69.524032,245.52451 97.372724,256 127.67411,256 Z m 41.60702,-61.98133 C 189.57566,177.68394 218.1014,178.27 237.62049,194.0459 249.28754,174.76386 256,152.16374 256,128.00034 c 0,-26.85042 -8.28793,-51.769568 -22.45139,-72.350916 -9.131,-1.939587 -19.02787,0.325741 -26.54036,6.966212 l -2.13843,1.889976 C 184.37854,82.617466 153.24774,81.516899 134.09348,62.003681 123.64732,51.36103 106.58366,51.011574 95.70776,61.217474 L 65.879285,89.2086 49.470132,71.811468 79.298607,43.820001 C 99.6717,24.70176 131.636,25.356444 151.20497,45.292785 c 10.2248,10.416813 26.8437,11.004304 37.78245,1.335536 l 2.13842,-1.889909 c 6.64005,-5.869189 14.32197,-9.825846 22.366,-11.906837 C 190.75623,12.421275 160.66937,0 127.67411,0 62.5305,0 8.7242884,48.41669 0.45065936,111.14157 20.23734,101.67056 44.644196,105.31504 60.77713,121.79424 c 10.185043,10.40324 26.584631,11.50108 38.071994,2.54936 l 16.677656,-12.99623 c 20.96064,-16.333367 50.58976,-15.542866 70.64448,1.88493 l 32.46987,28.21744 -15.73073,18.00977 -32.46987,-28.21675 c -11.40333,-9.91056 -28.25178,-10.36033 -40.17025,-1.07263 l -16.67765,12.9969 C 92.486461,159.61353 62.356352,157.59639 43.643919,138.48264 32.762761,127.36794 14.966434,126.98019 3.609064,137.61037 L 0,140.98839 c 2.7009241,26.73389 13.649562,51.04108 30.269414,70.34973 l 27.34647,-23.38517 c 21.235909,-18.16038 53.135306,-16.03488 71.761456,4.78115 9.73221,10.87688 26.30602,12.22823 37.67997,3.07342 z' fill='%23ffffff' id='path1050' style='stroke-width:6.82333' /%3E%3C/svg%3E",
        name: 'sei',
        label: 'Sei',
      },
      {
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='91' height='91' viewBox='0 0 91 91' fill='none'%3E%3Ccircle cx='45.5' cy='45.5' r='45.5' fill='%23E8E8EC'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M26.833 25.8333C26.2807 25.8333 25.833 26.281 25.833 26.8333V63.1666C25.833 63.7189 26.2807 64.1666 26.833 64.1666H63.1663C63.7186 64.1666 64.1663 63.7189 64.1663 63.1666V48.7333C64.1663 48.4571 63.9425 48.2333 63.6663 48.2333C63.3902 48.2333 63.1663 48.4571 63.1663 48.7333V63.1666H26.833V26.8333L41.2663 26.8333C41.5425 26.8333 41.7663 26.6094 41.7663 26.3333C41.7663 26.0571 41.5425 25.8333 41.2663 25.8333H26.833ZM64.0199 25.9797C64.0321 25.9919 64.0435 26.0046 64.0542 26.0177L64.1663 26.324L64.1663 26.3342V37.5333C64.1663 37.8094 63.9425 38.0333 63.6663 38.0333C63.3902 38.0333 63.1663 37.8094 63.1663 37.5333V27.5404L41.6199 49.0868C41.4246 49.2821 41.1081 49.2821 40.9128 49.0868C40.7175 48.8915 40.7175 48.575 40.9128 48.3797L62.4592 26.8333H52.4663C52.1902 26.8333 51.9663 26.6094 51.9663 26.3333C51.9663 26.0571 52.1902 25.8333 52.4663 25.8333H63.666H63.6663C63.6823 25.8333 63.6983 25.834 63.7143 25.8355C63.7632 25.8402 63.8116 25.8521 63.8577 25.8712C63.9167 25.8956 63.972 25.9318 64.0199 25.9797Z' fill='%230F1022'/%3E%3Cpath d='M63.1663 63.1666V64.1666H64.1663V63.1666H63.1663ZM26.833 63.1666H25.833V64.1666H26.833V63.1666ZM26.833 26.8333L26.833 25.8333L25.833 25.8333V26.8333H26.833ZM41.2663 26.8333L41.2663 25.8333H41.2663L41.2663 26.8333ZM64.0542 26.0177L64.9934 25.6742L64.9356 25.5161L64.8292 25.3857L64.0542 26.0177ZM64.0199 25.9797L64.727 25.2726L64.727 25.2726L64.0199 25.9797ZM64.1663 26.324L65.1662 26.3158L65.1648 26.1429L65.1054 25.9806L64.1663 26.324ZM64.1663 26.3342L65.1664 26.3342L65.1663 26.326L64.1663 26.3342ZM63.1663 27.5404H64.1663V25.1261L62.4592 26.8333L63.1663 27.5404ZM40.9128 49.0868L40.2057 49.7939L40.2057 49.7939L40.9128 49.0868ZM40.9128 48.3797L40.2057 47.6726L40.2057 47.6726L40.9128 48.3797ZM62.4592 26.8333L63.1663 27.5404L64.8734 25.8333H62.4592V26.8333ZM63.7143 25.8355L63.8096 24.8401L63.8095 24.8401L63.7143 25.8355ZM63.8577 25.8712L64.2401 24.9472L64.24 24.9472L63.8577 25.8712ZM26.833 26.8333V26.8333V24.8333C25.7284 24.8333 24.833 25.7287 24.833 26.8333H26.833ZM26.833 63.1666V26.8333H24.833V63.1666H26.833ZM26.833 63.1666H26.833H24.833C24.833 64.2712 25.7284 65.1666 26.833 65.1666V63.1666ZM63.1663 63.1666H26.833V65.1666H63.1663V63.1666ZM63.1663 63.1666V65.1666C64.2709 65.1666 65.1663 64.2712 65.1663 63.1666H63.1663ZM63.1663 48.7333V63.1666H65.1663V48.7333H63.1663ZM63.6663 49.2333C63.3902 49.2333 63.1663 49.0094 63.1663 48.7333H65.1663C65.1663 47.9048 64.4948 47.2333 63.6663 47.2333V49.2333ZM64.1663 48.7333C64.1663 49.0094 63.9425 49.2333 63.6663 49.2333V47.2333C62.8379 47.2333 62.1663 47.9048 62.1663 48.7333H64.1663ZM64.1663 63.1666V48.7333H62.1663V63.1666H64.1663ZM26.833 64.1666H63.1663V62.1666H26.833V64.1666ZM25.833 26.8333V63.1666H27.833V26.8333H25.833ZM41.2663 25.8333L26.833 25.8333L26.833 27.8333L41.2663 27.8333L41.2663 25.8333ZM40.7663 26.3333C40.7663 26.0571 40.9902 25.8333 41.2663 25.8333V27.8333C42.0948 27.8333 42.7663 27.1617 42.7663 26.3333H40.7663ZM41.2663 26.8333C40.9902 26.8333 40.7663 26.6094 40.7663 26.3333H42.7663C42.7663 25.5048 42.0948 24.8333 41.2663 24.8333V26.8333ZM26.833 26.8333H41.2663V24.8333H26.833V26.8333ZM64.8292 25.3857C64.7971 25.3464 64.763 25.3086 64.727 25.2726L63.3128 26.6868C63.3012 26.6752 63.2899 26.6628 63.2793 26.6497L64.8292 25.3857ZM65.1054 25.9806L64.9934 25.6742L63.1151 26.3611L63.2271 26.6675L65.1054 25.9806ZM65.1663 26.326L65.1662 26.3158L63.1663 26.3322L63.1664 26.3425L65.1663 26.326ZM65.1663 37.5333V26.3342H63.1663V37.5333H65.1663ZM63.6663 39.0333C64.4948 39.0333 65.1663 38.3617 65.1663 37.5333H63.1663C63.1663 37.2571 63.3902 37.0333 63.6663 37.0333V39.0333ZM62.1663 37.5333C62.1663 38.3617 62.8379 39.0333 63.6663 39.0333V37.0333C63.9425 37.0333 64.1663 37.2571 64.1663 37.5333H62.1663ZM62.1663 27.5404V37.5333H64.1663V27.5404H62.1663ZM42.327 49.7939L63.8734 28.2475L62.4592 26.8333L40.9128 48.3797L42.327 49.7939ZM40.2057 49.7939C40.7915 50.3797 41.7412 50.3797 42.327 49.7939L40.9128 48.3797C41.108 48.1844 41.4246 48.1844 41.6199 48.3797L40.2057 49.7939ZM40.2057 47.6726C39.6199 48.2584 39.6199 49.2081 40.2057 49.7939L41.6199 48.3797C41.8152 48.575 41.8152 48.8915 41.6199 49.0868L40.2057 47.6726ZM61.7521 26.1261L40.2057 47.6726L41.6199 49.0868L63.1663 27.5404L61.7521 26.1261ZM52.4663 27.8333H62.4592V25.8333H52.4663V27.8333ZM50.9663 26.3333C50.9663 27.1617 51.6379 27.8333 52.4663 27.8333V25.8333C52.7425 25.8333 52.9663 26.0571 52.9663 26.3333H50.9663ZM52.4663 24.8333C51.6379 24.8333 50.9663 25.5048 50.9663 26.3333H52.9663C52.9663 26.6094 52.7425 26.8333 52.4663 26.8333V24.8333ZM63.666 24.8333H52.4663V26.8333H63.666V24.8333ZM63.6663 24.8333H63.666V26.8333H63.6663V24.8333ZM63.8095 24.8401C63.7619 24.8355 63.7141 24.8333 63.6663 24.8333V26.8333C63.6505 26.8333 63.6347 26.8325 63.619 26.831L63.8095 24.8401ZM64.24 24.9472C64.1011 24.8897 63.9559 24.8541 63.8096 24.8401L63.619 26.831C63.5706 26.8264 63.5221 26.8146 63.4754 26.7952L64.24 24.9472ZM64.727 25.2726C64.5845 25.1301 64.4184 25.0209 64.2401 24.9472L63.4754 26.7952C63.4151 26.7702 63.3594 26.7334 63.3128 26.6868L64.727 25.2726Z' fill='%230F1022'/%3E%3C/svg%3E",
        name: 'more',
        label: 'More networks',
        showOpenInNewIcon: false,
        href: `#/advance-tools/#/transfer`,
      },
    ],
  },
  moreTokens: {
    label: 'More tokens ...',
    href: `#/advance-tools/#/transfer?sourceChain={:sourceChain}&targetChain={:targetChain}`,
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

export const MORE_NETWORKS = config && config.moreNetworks;
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
