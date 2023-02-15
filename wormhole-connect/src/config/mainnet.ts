import { CONFIG } from '@wormhole-foundation/wormhole-connect-sdk';
import { NetworksConfig, TokenConfig } from './types';

const { chains } = CONFIG.MAINNET;

export const MAINNET_NETWORKS: NetworksConfig = {
  ethereum: {
    ...chains.ethereum!,
    icon: 'eth',
    nativeToken: 'ETH',
  },
  bsc: {
    ...chains.bsc!,
    icon: 'bsc',
    nativeToken: 'BNB',
  },
  polygon: {
    ...chains.polygon!,
    icon: 'polygon',
    nativeToken: 'MATIC',
  },
  avalanche: {
    ...chains.avalanche!,
    icon: 'avax',
    nativeToken: 'AVAX',
  },
  fantom: {
    ...chains.fantom!,
    icon: 'fantom',
    nativeToken: 'FTM',
  },
  celo: {
    ...chains.celo!,
    icon: 'celo',
    nativeToken: 'CELO',
  },
};

// export const MAINNET_TOKENS: { [key: string]: TokenConfig } = {
//   MATIC: {
//     symbol: 'MATIC',
//     nativeNetwork: 'polygon',
//     icon: 'polygon',
//     coinGeckoId: 'polygon',
//     color: '#8247E5',
//     decimals: 18,
//     wrappedAsset: 'WMATIC',
//   },
//   WMATIC: {
//     symbol: 'WMATIC',
//     nativeNetwork: 'polygon',
//     icon: 'polygon',
//     tokenId: {
//       chain: 'polygon',
//       address: '0x1234...5678',
//     },
//     coinGeckoId: 'polygon',
//     color: '#8247E5',
//     decimals: 18,
//   },
//   SOL: {
//     symbol: 'SOL',
//     nativeNetwork: 'solana',
//     icon: 'solana',
//     coinGeckoId: 'solana',
//     color: '#28D4B5',
//     decimals: 18,
//   },
//   WAVAX: {
//     symbol: 'WAVAX',
//     nativeNetwork: 'avalanche',
//     icon: 'avax',
//     tokenId: {
//       chain: 'avalanche',
//       address: '0x1234...5678',
//     },
//     coinGeckoId: 'wrapped-avax',
//     color: '#E84142',
//     decimals: 18,
//   },
//   CELO: {
//     symbol: 'CELO',
//     nativeNetwork: 'celo',
//     icon: 'celo',
//     tokenId: {
//       chain: 'celo',
//       address: '0x1234...5678',
//     },
//     coinGeckoId: 'celo',
//     color: '#35D07E',
//     decimals: 18,
//   },
//   BNB: {
//     symbol: 'BNB',
//     nativeNetwork: 'bsc',
//     icon: 'bnb',
//     coinGeckoId: 'bnb',
//     color: '#F3BA30',
//     decimals: 18,
//   },
// };

export const MAINNET_TOKENS: { [key: string]: TokenConfig } = {
  ETH: {
    symbol: 'ETH',
    nativeNetwork: 'ethereum',
    icon: 'eth',
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
    wrappedAsset: 'WETH',
  },
  WETH: {
    symbol: 'WETH',
    nativeNetwork: 'ethereum',
    icon: 'eth',
    tokenId: {
      chain: 'ethereum',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
  },
  MATIC: {
    symbol: 'MATIC',
    nativeNetwork: 'polygon',
    icon: 'polygon',
    coinGeckoId: 'matic-network',
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
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    coinGeckoId: 'matic-network',
    color: '#8247E5',
    decimals: 18,
  },
  BNB: {
    symbol: 'BNB',
    nativeNetwork: 'bsc',
    icon: 'bnb',
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: 18,
    wrappedAsset: 'WBNB',
  },
  WBNB: {
    symbol: 'WBNB',
    nativeNetwork: 'bsc',
    icon: 'bnb',
    tokenId: {
      chain: 'bsc',
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    },
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: 18,
  },
  AVAX: {
    symbol: 'AVAX',
    nativeNetwork: 'avalanche',
    icon: 'avax',
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: 18,
    wrappedAsset: 'WAVAX',
  },
  WAVAX: {
    symbol: 'WAVAX',
    nativeNetwork: 'avalanche',
    icon: 'avax',
    tokenId: {
      chain: 'avalanche',
      address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    },
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: 18,
  },
  FTM: {
    symbol: 'FTM',
    nativeNetwork: 'fantom',
    icon: 'fantom',
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: 18,
    wrappedAsset: 'WFTM',
  },
  WFTM: {
    symbol: 'WFTM',
    nativeNetwork: 'fantom',
    icon: 'fantom',
    tokenId: {
      chain: 'fantom',
      address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    },
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: 18,
  },
  CELO: {
    symbol: 'CELO',
    nativeNetwork: 'celo',
    icon: 'celo',
    tokenId: {
      chain: 'celo',
      address: '0x471ece3750da237f93b8e339c536989b8978a438',
    },
    coinGeckoId: 'celo',
    color: '#35D07E',
    decimals: 18,
  },
};
