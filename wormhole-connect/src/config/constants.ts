import { type Chain } from '@wormhole-foundation/sdk';

export const WORMSCAN = 'https://wormholescan.io/#/';

export const AVAILABLE_MARKETS_URL =
  'https://portalbridge.com/docs/faqs/liquid-markets/';

export const CONNECT_VERSION =
  import.meta.env.REACT_APP_CONNECT_VERSION || 'unknown';

export const CONNECT_GIT_HASH =
  import.meta.env.REACT_APP_CONNECT_GIT_HASH || 'unknown';

export const CHAIN_ORDER: Chain[] = [
  'Ethereum',
  'Solana',
  'Arbitrum',
  'Base',
  'Sui',
  'Bsc',
  'Optimism',
  'Fantom',
  'Polygon',
  'Avalanche',
  'Osmosis',
  'Celo',
  'Moonbeam',
  'Klaytn',
  'Injective',
  'Kujira',
  'Scroll',
  'Evmos',
  'Mantle',
];
