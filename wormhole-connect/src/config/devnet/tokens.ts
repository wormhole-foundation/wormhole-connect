import { Icon, TokensConfig } from '../types';

export const DEVNET_TOKENS: TokensConfig = {
  ETH: {
    key: 'ETH',
    symbol: 'ETH',
    nativeChain: 'ethereum',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETH',
  },
  WETH: {
    key: 'WETH',
    symbol: 'WETH',
    nativeChain: 'ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'ethereum',
      address: '0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  TKN: {
    key: 'TKN',
    symbol: 'TKN',
    nativeChain: 'ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'ethereum',
      address: '0x2D8BE6BF0baA74e0A907016679CaE9190e80dD0A',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  OSMO: {
    key: 'OSMO',
    symbol: 'OSMO',
    nativeChain: 'osmosis',
    tokenId: {
      chain: 'osmosis',
      address: 'uosmo',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'osmo',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
  WORM: {
    key: 'WORM',
    symbol: 'WORM',
    nativeChain: 'wormchain',
    tokenId: {
      chain: 'wormchain',
      address: 'uworm',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'worm',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
  LUNA: {
    key: 'LUNA',
    symbol: 'LUNA',
    nativeChain: 'terra2',
    tokenId: {
      chain: 'terra2',
      address: 'uluna',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'uluna',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
};
