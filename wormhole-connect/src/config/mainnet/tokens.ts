import { TokenIcon, TokenConfig } from '../types';

export const MAINNET_TOKENS: TokenConfig[] = [
  {
    symbol: 'ETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: { chain: 'Ethereum', address: 'native' },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: {
      chain: 'Ethereum',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
  {
    symbol: 'USDC',
    decimals: 6,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
  },
  {
    symbol: 'WBTC',
    decimals: 8,
    icon: TokenIcon.WBTC,
    tokenId: {
      chain: 'Ethereum',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    },
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Ethereum',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  },
  {
    symbol: 'DAI',
    decimals: 18,
    icon: TokenIcon.DAI,
    tokenId: {
      chain: 'Ethereum',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    },
  },
  {
    symbol: 'BUSD',
    decimals: 18,
    icon: TokenIcon.BUSD,
    tokenId: {
      chain: 'Ethereum',
      address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
    },
  },
  {
    symbol: 'POL',
    decimals: 18,
    icon: TokenIcon.POLYGON,
    tokenId: { chain: 'Polygon', address: 'native' },
  },
  {
    symbol: 'WPOL',
    decimals: 18,
    icon: TokenIcon.POLYGON,
    tokenId: {
      chain: 'Polygon',
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: {
      chain: 'Polygon',
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    },
  },
  {
    symbol: 'USDC',
    decimals: 6,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Polygon',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    },
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Polygon',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
  },
  {
    symbol: 'BNB',
    decimals: 18,
    icon: TokenIcon.BNB,
    tokenId: { chain: 'Bsc', address: 'native' },
  },
  {
    symbol: 'WBNB',
    decimals: 18,
    icon: TokenIcon.BNB,
    tokenId: {
      chain: 'Bsc',
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    },
  },
  {
    symbol: 'USDC',
    decimals: 18,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Bsc',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    },
  },
  {
    symbol: 'AVAX',
    decimals: 18,
    icon: TokenIcon.AVAX,
    tokenId: { chain: 'Avalanche', address: 'native' },
  },
  {
    symbol: 'WAVAX',
    decimals: 18,
    icon: TokenIcon.AVAX,
    tokenId: {
      chain: 'Avalanche',
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    },
  },
  {
    symbol: 'USDC',
    decimals: 6,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Avalanche',
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    },
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Avalanche',
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: {
      chain: 'Avalanche',
      address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    },
  },
  {
    symbol: 'FTM',
    decimals: 18,
    icon: TokenIcon.FANTOM,
    tokenId: { chain: 'Fantom', address: 'native' },
  },
  {
    symbol: 'WFTM',
    name: 'Wrapped Fantom',
    decimals: 18,
    icon: TokenIcon.FANTOM,
    tokenId: {
      chain: 'Fantom',
      address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    },
  },
  {
    symbol: 'USDC.e',
    decimals: 6,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Fantom',
      address: '0x2F733095B80A04b38b0D10cC884524a3d09b836a',
    },
  },
  {
    symbol: 'CELO',
    decimals: 18,
    icon: TokenIcon.CELO,
    tokenId: {
      chain: 'Celo',
      address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    },
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Celo',
      address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
    },
  },
  {
    symbol: 'GLMR',
    decimals: 18,
    icon: TokenIcon.GLMR,
    tokenId: { chain: 'Moonbeam', address: 'native' },
  },
  {
    symbol: 'WGLMR',
    decimals: 18,
    icon: TokenIcon.GLMR,
    tokenId: {
      chain: 'Moonbeam',
      address: '0xAcc15dC74880C9944775448304B263D191c6077F',
    },
  },
  {
    symbol: 'SOL',
    decimals: 9,
    icon: TokenIcon.SOLANA,
    tokenId: { chain: 'Solana', address: 'native' },
  },
  {
    symbol: 'WSOL',
    decimals: 9,
    tokenId: {
      chain: 'Solana',
      address: 'So11111111111111111111111111111111111111112',
    },
    icon: TokenIcon.SOLANA,
  },
  {
    symbol: 'USDC',
    decimals: 6,
    tokenId: {
      chain: 'Solana',
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
    icon: TokenIcon.USDC,
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Solana',
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    },
  },
  {
    symbol: 'SUI',
    decimals: 9,
    tokenId: { chain: 'Sui', address: 'native' },
    icon: TokenIcon.SUI,
  },
  {
    symbol: 'USDC',
    decimals: 6,
    tokenId: {
      chain: 'Sui',
      address:
        '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    },
    icon: TokenIcon.USDC,
  },
  {
    symbol: 'APT',
    decimals: 8,
    tokenId: { chain: 'Aptos', address: 'native' },
    icon: TokenIcon.APT,
  },
  {
    symbol: 'USDC',
    decimals: 6,
    tokenId: {
      chain: 'Aptos',
      address:
        '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
    },
    icon: TokenIcon.USDC,
  },
  {
    symbol: 'ETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: { chain: 'Arbitrum', address: 'native' },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: {
      chain: 'Arbitrum',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
  },
  {
    symbol: 'USDC',
    decimals: 6,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Arbitrum',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Arbitrum',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
  },
  {
    symbol: 'ETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: { chain: 'Optimism', address: 'native' },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: {
      chain: 'Optimism',
      address: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    symbol: 'USDC',
    decimals: 6,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Optimism',
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    },
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Optimism',
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: {
      chain: 'Bsc',
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    },
  },
  {
    symbol: 'USDT',
    decimals: 18,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Bsc',
      address: '0x55d398326f99059fF775485246999027B3197955',
    },
  },
  {
    symbol: 'ETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: { chain: 'Base', address: 'native' },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.ETH,
    tokenId: {
      chain: 'Base',
      address: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    symbol: 'USDC',
    decimals: 6,
    icon: TokenIcon.USDC,
    tokenId: {
      chain: 'Base',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
  },
  {
    symbol: 'USDT',
    decimals: 6,
    icon: TokenIcon.USDT,
    tokenId: {
      chain: 'Base',
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    },
  },
  {
    symbol: 'wstETH',
    decimals: 18,
    tokenId: {
      chain: 'Base',
      address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    },
    icon: TokenIcon.WSTETH,
  },
  {
    symbol: 'wstETH',
    decimals: 18,
    tokenId: {
      chain: 'Ethereum',
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    },
    icon: TokenIcon.WSTETH,
  },
  {
    symbol: 'wstETH',
    decimals: 18,
    tokenId: {
      chain: 'Arbitrum',
      address: '0x5979D7b546E38E414F7E9822514be443A4800529',
    },
    icon: TokenIcon.WSTETH,
  },
  {
    symbol: 'wstETH',
    decimals: 18,
    tokenId: {
      chain: 'Optimism',
      address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
    },
    icon: TokenIcon.WSTETH,
  },
  {
    symbol: 'wstETH',
    decimals: 18,
    tokenId: {
      chain: 'Polygon',
      address: '0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD',
    },
    icon: TokenIcon.WSTETH,
  },
  {
    symbol: 'KLAY',
    decimals: 18,
    icon: TokenIcon.KLAY,
    tokenId: { chain: 'Klaytn', address: 'native' },
  },
  {
    symbol: 'WKLAY',
    decimals: 18,
    name: 'wKLAY',
    icon: TokenIcon.KLAY,
    tokenId: {
      chain: 'Klaytn',
      address: '0xe4f05A66Ec68B54A58B17c22107b02e0232cC817',
    },
  },
  {
    symbol: 'PYTH',
    decimals: 6,
    tokenId: {
      chain: 'Solana',
      address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    },
    icon: TokenIcon.PYTH,
  },
  {
    symbol: 'ETH',
    decimals: 18,
    icon: TokenIcon.SCROLL,
    tokenId: { chain: 'Scroll', address: 'native' },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.SCROLL,
    tokenId: {
      chain: 'Scroll',
      address: '0x5300000000000000000000000000000000000004',
    },
  },
  {
    symbol: 'ETH',
    decimals: 18,
    icon: TokenIcon.BLAST,
    tokenId: { chain: 'Blast', address: 'native' },
  },
  {
    symbol: 'WETH',
    decimals: 18,
    icon: TokenIcon.BLAST,
    tokenId: {
      chain: 'Blast',
      address: '0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7',
    },
  },
  {
    symbol: 'OKB',
    decimals: 18,
    icon: TokenIcon.XLAYER,
    tokenId: { chain: 'Xlayer', address: 'native' },
  },
  {
    symbol: 'WOKB',
    decimals: 18,
    icon: TokenIcon.XLAYER,
    tokenId: {
      chain: 'Xlayer',
      address: '0xe538905cf8410324e03A5A23C1c177a474D59b2b',
    },
  },
  {
    symbol: 'MNT',
    decimals: 18,
    icon: TokenIcon.MANTLE,
    tokenId: { chain: 'Mantle', address: 'native' },
  },
  {
    symbol: 'WMNT',
    decimals: 18,
    icon: TokenIcon.MANTLE,
    tokenId: {
      chain: 'Mantle',
      address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
    },
  },
  {
    symbol: 'tBTC',
    decimals: 18,
    tokenId: {
      chain: 'Ethereum',
      address: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
    },
    icon: TokenIcon.TBTC,
  },
  {
    symbol: 'tBTC',
    decimals: 18,
    tokenId: {
      chain: 'Polygon',
      address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
    },
    icon: TokenIcon.TBTC,
  },
  {
    symbol: 'tBTC',
    decimals: 18,
    tokenId: {
      chain: 'Optimism',
      address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
    },
    icon: TokenIcon.TBTC,
  },
  {
    symbol: 'tBTC',
    decimals: 18,
    tokenId: {
      chain: 'Arbitrum',
      address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
    },
    icon: TokenIcon.TBTC,
  },
  {
    symbol: 'tBTC',
    decimals: 18,
    tokenId: {
      chain: 'Base',
      address: '0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b',
    },
    icon: TokenIcon.TBTC,
  },
  {
    symbol: 'tBTC',
    decimals: 8,
    tokenId: {
      chain: 'Solana',
      address: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU',
    },
    icon: TokenIcon.TBTC,
  },
  {
    symbol: 'ETH',
    tokenId: {
      chain: 'Worldchain',
      address: 'native',
    },
    decimals: 18,
    icon: TokenIcon.WORLDCHAIN,
  },
  {
    symbol: 'WETH',
    tokenId: {
      chain: 'Worldchain',
      address: '0x4200000000000000000000000000000000000006',
    },
    decimals: 18,
    icon: TokenIcon.WORLDCHAIN,
  },
  {
    symbol: 'ETH',
    tokenId: {
      chain: 'Unichain',
      address: 'native',
    },
    decimals: 18,
    icon: TokenIcon.ETH,
  },
  {
    symbol: 'WETH',
    tokenId: {
      chain: 'Unichain',
      address: '0x4200000000000000000000000000000000000006',
    },
    decimals: 18,
    icon: TokenIcon.ETH,
  },
  {
    symbol: 'USDC',
    tokenId: {
      chain: 'Unichain',
      address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
    },
    decimals: 6,
    icon: TokenIcon.USDC,
  },
];
