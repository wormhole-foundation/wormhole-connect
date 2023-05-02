import { CONFIG } from '@wormhole-foundation/wormhole-connect-sdk';
import { NetworksConfig, TokenConfig, Icon, GasEstimates } from './types';

const { chains } = CONFIG.MAINNET;

export const MAINNET_NETWORKS: NetworksConfig = {
  ethereum: {
    ...chains.ethereum!,
    displayName: 'Ethereum',
    explorerUrl: 'https://etherscan.io/',
    explorerName: 'Etherscan',
    gasToken: 'ETH',
    chainId: 1,
    icon: Icon.ETH,
    automaticRelayer: true,
    maxBlockSearch: 2000,
  },
  bsc: {
    ...chains.bsc!,
    displayName: 'BSC',
    explorerUrl: 'https://bscscan.com/',
    explorerName: 'BscScan',
    gasToken: 'BNB',
    chainId: 56,
    icon: Icon.BSC,
    automaticRelayer: true,
    maxBlockSearch: 2000,
  },
  polygon: {
    ...chains.polygon!,
    displayName: 'Polygon',
    explorerUrl: 'https://polygonscan.com/',
    explorerName: 'PolygonScan',
    gasToken: 'MATIC',
    chainId: 137,
    icon: Icon.POLYGON,
    automaticRelayer: true,
    maxBlockSearch: 1000,
  },
  avalanche: {
    ...chains.avalanche!,
    displayName: 'Avalanche',
    explorerUrl: 'https://snowtrace.io/',
    explorerName: 'Snowtrace',
    gasToken: 'WAVAX',
    chainId: 43114,
    icon: Icon.AVAX,
    automaticRelayer: true,
    maxBlockSearch: 2000,
  },
  fantom: {
    ...chains.fantom!,
    displayName: 'Fantom',
    explorerUrl: 'https://ftmscan.com/',
    explorerName: 'FTMscan',
    gasToken: 'FTM',
    chainId: 250,
    icon: Icon.FANTOM,
    automaticRelayer: true,
    maxBlockSearch: 2000,
  },
  celo: {
    ...chains.celo!,
    displayName: 'Celo',
    explorerUrl: 'https://explorer.celo.org/mainnet/',
    explorerName: 'Celo Explorer',
    gasToken: 'CELO',
    chainId: 42220,
    icon: Icon.CELO,
    automaticRelayer: true,
    maxBlockSearch: 2000,
  },
  moonbeam: {
    ...chains.moonbeam!,
    displayName: 'Moonbeam',
    explorerUrl: 'https://moonscan.io/',
    explorerName: 'Moonscan',
    gasToken: 'GLMR',
    chainId: 1284,
    icon: Icon.GLMR,
    automaticRelayer: true,
    maxBlockSearch: 2000,
  },
  solana: {
    ...chains.solana!,
    displayName: 'Solana',
    explorerUrl: 'https://explorer.solana.com/',
    explorerName: 'Solana Explorer',
    gasToken: 'SOL',
    chainId: 0,
    icon: Icon.SOLANA,
    automaticRelayer: false,
    maxBlockSearch: 2000,
  },
  sui: {
    ...chains.sui!,
    displayName: 'Sui',
    explorerUrl: 'https://explorer.sui.io/',
    explorerName: 'Sui Explorer',
    gasToken: 'SUI',
    chainId: 0,
    icon: Icon.SUI,
    automaticRelayer: true,
    maxBlockSearch: 0,
  },
};

export const MAINNET_TOKENS: { [key: string]: TokenConfig } = {
  ETH: {
    key: 'ETH',
    symbol: 'ETH',
    nativeNetwork: 'ethereum',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
    wrappedAsset: 'WETH',
  },
  WETH: {
    key: 'WETH',
    symbol: 'WETH',
    nativeNetwork: 'ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'ethereum',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  USDCeth: {
    key: 'USDCeth',
    symbol: 'USDC',
    nativeNetwork: 'ethereum',
    icon: Icon.USDC,
    tokenId: {
      chain: 'ethereum',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    coinGeckoId: 'usd-coin',
    color: '#ffffff',
    decimals: 6,
    solDecimals: 6,
    suiDecimals: 6,
  },
  WBTC: {
    key: 'WBTC',
    symbol: 'WBTC',
    nativeNetwork: 'ethereum',
    icon: Icon.WBTC,
    tokenId: {
      chain: 'ethereum',
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    coinGeckoId: 'wrapped-bitcoin',
    color: '#ffffff',
    decimals: 8,
    solDecimals: 8,
    suiDecimals: 8,
  },
  USDT: {
    key: 'USDT',
    symbol: 'USDT',
    nativeNetwork: 'ethereum',
    icon: Icon.USDT,
    tokenId: {
      chain: 'ethereum',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
    coinGeckoId: 'tether',
    color: '#ffffff',
    decimals: 6,
    solDecimals: 6,
    suiDecimals: 6,
  },
  DAI: {
    key: 'DAI',
    symbol: 'DAI',
    nativeNetwork: 'ethereum',
    icon: Icon.DAI,
    tokenId: {
      chain: 'ethereum',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    },
    coinGeckoId: 'dai',
    color: '#FEFEFD',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  BUSD: {
    key: 'BUSD',
    symbol: 'BUSD',
    nativeNetwork: 'ethereum',
    icon: Icon.BUSD,
    tokenId: {
      chain: 'ethereum',
      address: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    },
    coinGeckoId: 'binance-usd',
    color: '#F0B90B',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  MATIC: {
    key: 'MATIC',
    symbol: 'MATIC',
    nativeNetwork: 'polygon',
    icon: Icon.POLYGON,
    coinGeckoId: 'matic-network',
    color: '#8247E5',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
    wrappedAsset: 'WMATIC',
  },
  WMATIC: {
    key: 'WMATIC',
    symbol: 'WMATIC',
    nativeNetwork: 'polygon',
    icon: Icon.POLYGON,
    tokenId: {
      chain: 'polygon',
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    coinGeckoId: 'matic-network',
    color: '#8247E5',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  USDCpolygon: {
    key: 'USDCpolygon',
    symbol: 'USDC',
    nativeNetwork: 'polygon',
    icon: Icon.USDC,
    tokenId: {
      chain: 'polygon',
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: 6,
    solDecimals: 6,
    suiDecimals: 6,
  },
  BNB: {
    key: 'BNB',
    symbol: 'BNB',
    nativeNetwork: 'bsc',
    icon: Icon.BNB,
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
    wrappedAsset: 'WBNB',
  },
  WBNB: {
    key: 'WBNB',
    symbol: 'WBNB',
    nativeNetwork: 'bsc',
    icon: Icon.BNB,
    tokenId: {
      chain: 'bsc',
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    },
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  USDCbnb: {
    key: 'USDCbnb',
    symbol: 'USDC',
    nativeNetwork: 'bsc',
    icon: Icon.USDC,
    tokenId: {
      chain: 'bsc',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  AVAX: {
    key: 'AVAX',
    symbol: 'AVAX',
    nativeNetwork: 'avalanche',
    icon: Icon.AVAX,
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
    wrappedAsset: 'WAVAX',
  },
  WAVAX: {
    key: 'WAVAX',
    symbol: 'WAVAX',
    nativeNetwork: 'avalanche',
    icon: Icon.AVAX,
    tokenId: {
      chain: 'avalanche',
      address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    },
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  USDCavax: {
    key: 'USDCavax',
    symbol: 'USDC',
    nativeNetwork: 'avalanche',
    icon: Icon.USDC,
    tokenId: {
      chain: 'avalanche',
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: 6,
    solDecimals: 6,
    suiDecimals: 6,
  },
  FTM: {
    key: 'FTM',
    symbol: 'FTM',
    nativeNetwork: 'fantom',
    icon: Icon.FANTOM,
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
    wrappedAsset: 'WFTM',
  },
  WFTM: {
    key: 'WFTM',
    symbol: 'WFTM',
    nativeNetwork: 'fantom',
    icon: Icon.FANTOM,
    tokenId: {
      chain: 'fantom',
      address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    },
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  CELO: {
    key: 'CELO',
    symbol: 'CELO',
    nativeNetwork: 'celo',
    icon: Icon.CELO,
    tokenId: {
      chain: 'celo',
      address: '0x471ece3750da237f93b8e339c536989b8978a438',
    },
    coinGeckoId: 'celo',
    color: '#35D07E',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  GLMR: {
    key: 'GLMR',
    symbol: 'GLMR',
    nativeNetwork: 'moonbeam',
    icon: Icon.GLMR,
    coinGeckoId: 'moonbeam',
    color: '#e1147b',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
    wrappedAsset: 'WGLMR',
  },
  WGLMR: {
    key: 'WGLMR',
    symbol: 'WGLMR',
    nativeNetwork: 'moonbeam',
    icon: Icon.GLMR,
    tokenId: {
      chain: 'moonbeam',
      address: '0xAcc15dC74880C9944775448304B263D191c6077F',
    },
    coinGeckoId: 'moonbeam',
    color: '#e1147b',
    decimals: 18,
    solDecimals: 8,
    suiDecimals: 8,
  },
  SOL: {
    key: 'SOL',
    symbol: 'SOL',
    nativeNetwork: 'solana',
    icon: Icon.SOLANA,
    coinGeckoId: 'solana',
    color: '#8457EF',
    decimals: 9,
    solDecimals: 9,
    suiDecimals: 8,
    wrappedAsset: 'WSOL',
  },
  WSOL: {
    key: 'WSOL',
    symbol: 'WSOL',
    nativeNetwork: 'solana',
    tokenId: {
      chain: 'solana',
      address: 'So11111111111111111111111111111111111111112',
    },
    icon: Icon.SOLANA,
    coinGeckoId: 'solana',
    color: '#8457EF',
    decimals: 9,
    solDecimals: 9,
    suiDecimals: 8,
  },
  USDCsol: {
    key: 'USDCsol',
    symbol: 'USDC',
    nativeNetwork: 'solana',
    tokenId: {
      chain: 'solana',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    icon: Icon.USDC,
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: 6,
    solDecimals: 6,
    suiDecimals: 6,
  },
  SUI: {
    key: 'SUI',
    symbol: 'SUI',
    nativeNetwork: 'sui',
    tokenId: {
      chain: 'sui',
      address: '0x2::sui::SUI',
    },
    icon: Icon.SUI,
    coinGeckoId: 'sui',
    color: '#8457EF',
    decimals: 9,
    solDecimals: 8,
    suiDecimals: 9,
  },
};

export const MAINNET_GAS_ESTIMATES: GasEstimates = {
  ethereum: {
    sendNative: 100000,
    sendToken: 150000,
    sendNativeWithRelay: 200000,
    sendTokenWithRelay: 300000,
    claim: 300000,
  },
  polygon: {
    sendNative: 100000,
    sendToken: 150000,
    sendNativeWithRelay: 200000,
    sendTokenWithRelay: 250000,
    claim: 300000,
  },
  bsc: {
    sendNative: 100000,
    sendToken: 200000,
    sendNativeWithRelay: 200000,
    sendTokenWithRelay: 300000,
    claim: 250000,
  },
  avalanche: {
    sendNative: 100000,
    sendToken: 150000,
    sendNativeWithRelay: 200000,
    sendTokenWithRelay: 300000,
    claim: 300000,
  },
  fantom: {
    sendNative: 100000,
    sendToken: 150000,
    sendNativeWithRelay: 250000,
    sendTokenWithRelay: 300000,
    claim: 300000,
  },
  celo: {
    sendNative: 150000,
    sendToken: 150000,
    sendNativeWithRelay: 300000,
    sendTokenWithRelay: 300000,
    claim: 300000,
  },
  moonbeam: {
    sendNative: 100000,
    sendToken: 150000,
    sendNativeWithRelay: 200000,
    sendTokenWithRelay: 300000,
    claim: 300000,
  },
  solana: {
    sendNative: 15000,
    sendToken: 15000,
    claim: 25000,
  },
  sui: {
    sendNative: 5100000,
    sendToken: 5100000,
    sendNativeWithRelay: 5100000,
    sendTokenWithRelay: 5100000,
    claim: 5100000,
  },
};
