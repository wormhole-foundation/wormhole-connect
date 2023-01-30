import { CONFIG } from '@wormhole-foundation/wormhole-connect-sdk';
import { NetworksConfig, TokenConfig } from './types';

const { chains } = CONFIG.MAINNET;

export const MAINNET_NETWORKS: NetworksConfig = {
  solana: {
    ...chains.solana!,
    icon: 'solana',
  },
  ethereum: {
    ...chains.ethereum!,
    icon: 'eth',
  },
  terra: {
    ...chains.terra!,
    icon: 'terra',
  },
  bsc: {
    ...chains.bsc!,
    icon: 'bsc',
  },
  polygon: {
    ...chains.polygon!,
    icon: 'polygon',
  },
  avalanche: {
    ...chains.avalanche!,
    icon: 'avax',
  },
  oasis: {
    ...chains.oasis!,
    icon: 'oasis',
  },
  algorand: {
    ...chains.algorand!,
    icon: 'algorand',
  },
  aurora: {
    ...chains.aurora!,
    icon: 'aurora',
  },
  fantom: {
    ...chains.fantom!,
    icon: 'fantom',
  },
  karura: {
    ...chains.karura!,
    icon: 'karura',
  },
  acala: {
    ...chains.acala!,
    icon: 'acala',
  },
  klaytn: {
    ...chains.klaytn!,
    icon: 'kalytn',
  },
  celo: {
    ...chains.celo!,
    icon: 'celo',
  },
  near: {
    ...chains.near!,
    icon: 'near',
  },
  injective: {
    ...chains.injective!,
    icon: 'injective',
  },
  osmosis: {
    ...chains.osmosis!,
    icon: 'osmosis',
  },
  aptos: {
    ...chains.aptos!,
    icon: 'aptos',
  },
  sui: {
    ...chains.sui!,
    icon: 'sui',
  },
  moonbeam: {
    ...chains.moonbeam!,
    icon: 'moonbeam',
  },
  neon: {
    ...chains.neon!,
    icon: 'neon',
  },
  terra2: {
    ...chains.terra2!,
    icon: 'terra2',
  },
  arbitrum: {
    ...chains.arbitrum!,
    icon: 'arbitrum',
  },
  optimism: {
    ...chains.optimism!,
    icon: 'optimism',
  },
  gnosis: {
    ...chains.gnosis!,
  },
  pythnet: {
    ...chains.pythnet!,
  },
  xpla: {
    ...chains.xpla!,
    icon: 'xpla',
  },
  btc: {
    ...chains.btc!,
  },
  wormchain: {
    ...chains.wormchain!,
  },
};

export const MAINNET_TOKENS: { [key: string]: TokenConfig } = {
  MATIC: {
    symbol: 'MATIC',
    nativeNetwork: 'polygon',
    icon: 'polygon',
    tokenId: 'native',
    coinGeckoId: 'polygon',
    color: '#8247E5',
    decimals: 18,
  },
  WMATIC: {
    symbol: 'WMATIC',
    nativeNetwork: 'polygon',
    icon: 'polygon',
    tokenId: {
      chain: 'polygon',
      address: '0x1234...5678',
    },
    coinGeckoId: 'polygon',
    color: '#8247E5',
    decimals: 18,
  },
  SOL: {
    symbol: 'SOL',
    nativeNetwork: 'solana',
    icon: 'solana',
    tokenId: 'native',
    coinGeckoId: 'solana',
    color: '#28D4B5',
    decimals: 18,
  },
  WAVAX: {
    symbol: 'WAVAX',
    nativeNetwork: 'avalanche',
    icon: 'avax',
    tokenId: {
      chain: 'avalanche',
      address: '0x1234...5678',
    },
    coinGeckoId: 'wrapped-avax',
    color: '#E84142',
    decimals: 18,
  },
  CELO: {
    symbol: 'CELO',
    nativeNetwork: 'celo',
    icon: 'celo',
    tokenId: {
      chain: 'celo',
      address: '0x1234...5678',
    },
    coinGeckoId: 'celo',
    color: '#35D07E',
    decimals: 18,
  },
  BNB: {
    symbol: 'BNB',
    nativeNetwork: 'bsc',
    icon: 'bnb',
    tokenId: 'native',
    coinGeckoId: 'bnb',
    color: '#F3BA30',
    decimals: 18,
  },
};
