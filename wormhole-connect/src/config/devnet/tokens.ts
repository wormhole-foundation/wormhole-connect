import { Icon, TokensConfig, TokenAddressesByChain } from '../types';

export const DEVNET_TOKENS: TokensConfig = {
  ETH: {
    key: 'ETH',
    symbol: 'ETH',
    nativeChain: 'Ethereum',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
    wrappedAsset: 'WETH',
  },
  WETH: {
    key: 'WETH',
    symbol: 'WETH',
    nativeChain: 'Ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'Ethereum',
      address: '0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
  },
  TKN: {
    key: 'TKN',
    symbol: 'TKN',
    nativeChain: 'Ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'Ethereum',
      address: '0x2D8BE6BF0baA74e0A907016679CaE9190e80dD0A',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
  },
};

export const DEVNET_WRAPPED_TOKENS: TokenAddressesByChain = {};
