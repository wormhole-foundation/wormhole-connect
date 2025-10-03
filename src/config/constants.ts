import { type Chain } from '@wormhole-foundation/sdk';

export const WORMSCAN = 'https://wormholescan.io/#/';

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
  'HyperEVM',
  'Bsc',
  'Avalanche',
  'Unichain',
  'Optimism',
  'Polygon',
  'Celo',
  'Moonbeam',
  'Klaytn',
  'Scroll',
  'Mantle',
  'Berachain',
  'Mezo',
  'Fogo',
  'HyperCore',
  'Fantom',
];
