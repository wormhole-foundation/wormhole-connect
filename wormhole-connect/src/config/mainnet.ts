import { CONFIG } from '@wormhole-foundation/wormhole-connect-sdk';
import { NetworksConfig, TokenConfig } from './types';

const { chains } = CONFIG.MAINNET;

export const MAINNET_NETWORKS: NetworksConfig = {
  solana: {
    ...chains.solana!,
    icon: 'solana',
    nativeToken: '', // TODO: fill in tokens for Mainnet
  },
  ethereum: {
    ...chains.ethereum!,
    icon: 'eth',
    nativeToken: '',
  },
  terra: {
    ...chains.terra!,
    icon: 'terra',
    nativeToken: '',
  },
  bsc: {
    ...chains.bsc!,
    icon: 'bsc',
    nativeToken: '',
  },
  polygon: {
    ...chains.polygon!,
    icon: 'polygon',
    nativeToken: '',
  },
  avalanche: {
    ...chains.avalanche!,
    icon: 'avax',
    nativeToken: '',
  },
  oasis: {
    ...chains.oasis!,
    icon: 'oasis',
    nativeToken: '',
  },
  algorand: {
    ...chains.algorand!,
    icon: 'algorand',
    nativeToken: '',
  },
  aurora: {
    ...chains.aurora!,
    icon: 'aurora',
    nativeToken: '',
  },
  fantom: {
    ...chains.fantom!,
    icon: 'fantom',
    nativeToken: '',
  },
  karura: {
    ...chains.karura!,
    icon: 'karura',
    nativeToken: '',
  },
  acala: {
    ...chains.acala!,
    icon: 'acala',
    nativeToken: '',
  },
  klaytn: {
    ...chains.klaytn!,
    icon: 'kalytn',
    nativeToken: '',
  },
  celo: {
    ...chains.celo!,
    icon: 'celo',
    nativeToken: '',
  },
  near: {
    ...chains.near!,
    icon: 'near',
    nativeToken: '',
  },
  injective: {
    ...chains.injective!,
    icon: 'injective',
    nativeToken: '',
  },
  osmosis: {
    ...chains.osmosis!,
    icon: 'osmosis',
    nativeToken: '',
  },
  aptos: {
    ...chains.aptos!,
    icon: 'aptos',
    nativeToken: '',
  },
  sui: {
    ...chains.sui!,
    icon: 'sui',
    nativeToken: '',
  },
  moonbeam: {
    ...chains.moonbeam!,
    icon: 'moonbeam',
    nativeToken: '',
  },
  neon: {
    ...chains.neon!,
    icon: 'neon',
    nativeToken: '',
  },
  terra2: {
    ...chains.terra2!,
    icon: 'terra2',
    nativeToken: '',
  },
  arbitrum: {
    ...chains.arbitrum!,
    icon: 'arbitrum',
    nativeToken: '',
  },
  optimism: {
    ...chains.optimism!,
    icon: 'optimism',
    nativeToken: '',
  },
  gnosis: {
    ...chains.gnosis!,
    nativeToken: '',
  },
  pythnet: {
    ...chains.pythnet!,
    nativeToken: '',
  },
  xpla: {
    ...chains.xpla!,
    icon: 'xpla',
    nativeToken: '',
  },
  btc: {
    ...chains.btc!,
    nativeToken: '',
  },
  wormchain: {
    ...chains.wormchain!,
    nativeToken: '',
  },
};

export const MAINNET_TOKENS: { [key: string]: TokenConfig } = {
  MATIC: {
    symbol: 'MATIC',
    nativeNetwork: 'polygon',
    icon: 'polygon',
    coinGeckoId: 'polygon',
    color: '#8247E5',
    decimals: 18,
    wrappedAsset: 'WMATIC',
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
    coinGeckoId: 'bnb',
    color: '#F3BA30',
    decimals: 18,
  },
};
