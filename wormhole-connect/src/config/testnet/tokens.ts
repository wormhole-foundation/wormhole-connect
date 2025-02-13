import { TokenIcon, TokenConfig } from '../types';

export const TESTNET_TOKENS: TokenConfig[] = [
  {
    symbol: 'BNB',
    icon: TokenIcon.BNB,
    decimals: 18,
    tokenId: { chain: 'Bsc', address: 'native' },
  },
  {
    symbol: 'WBNB',
    icon: TokenIcon.BNB,
    decimals: 18,
    tokenId: {
      chain: 'Bsc',
      address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    },
  },
  {
    symbol: 'AVAX',
    icon: TokenIcon.AVAX,
    decimals: 18,
    tokenId: { chain: 'Avalanche', address: 'native' },
  },
  {
    symbol: 'WAVAX',
    icon: TokenIcon.AVAX,
    decimals: 18,
    tokenId: {
      chain: 'Avalanche',
      address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
    },
  },
  {
    symbol: 'USDC',
    icon: TokenIcon.USDC,
    decimals: 6,
    tokenId: {
      chain: 'Avalanche',
      address: '0x5425890298aed601595a70AB815c96711a31Bc65',
    },
  },
  {
    symbol: 'FTM',
    icon: TokenIcon.FANTOM,
    decimals: 18,
    tokenId: { chain: 'Fantom', address: 'native' },
  },
  {
    symbol: 'WFTM',
    icon: TokenIcon.FANTOM,
    decimals: 18,
    tokenId: {
      chain: 'Fantom',
      address: '0xf1277d1Ed8AD466beddF92ef448A132661956621',
    },
  },
  {
    symbol: 'CELO',
    icon: TokenIcon.CELO,
    decimals: 18,
    tokenId: {
      chain: 'Celo',
      address: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    },
  },
  {
    symbol: 'USDC.e',
    icon: TokenIcon.USDC,
    decimals: 6,
    tokenId: {
      chain: 'Celo',
      address: '0x72CAaa7e9889E0a63e016748179b43911A3ec9e5',
    },
  },
  {
    symbol: 'GLMR',
    icon: TokenIcon.GLMR,
    decimals: 18,
    tokenId: { chain: 'Moonbeam', address: 'native' },
  },
  {
    symbol: 'WGLMR',
    icon: TokenIcon.GLMR,
    decimals: 18,
    tokenId: {
      chain: 'Moonbeam',
      address: '0xD909178CC99d318e4D46e7E66a972955859670E1',
    },
  },
  {
    symbol: 'SOL',
    icon: TokenIcon.SOLANA,
    decimals: 9,
    tokenId: { chain: 'Solana', address: 'native' },
  },
  {
    symbol: 'WSOL',
    tokenId: {
      chain: 'Solana',
      address: 'So11111111111111111111111111111111111111112',
    },
    icon: TokenIcon.SOLANA,
    decimals: 9,
  },
  {
    symbol: 'USDC',
    tokenId: {
      chain: 'Solana',
      address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    },
    icon: TokenIcon.USDC,
    decimals: 6,
  },
  {
    symbol: 'SUI',
    tokenId: { chain: 'Sui', address: 'native' },
    icon: TokenIcon.SUI,
    decimals: 9,
  },
  {
    symbol: 'USDC',
    decimals: 6,
    tokenId: {
      chain: 'Sui',
      address:
        '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
    },
    icon: TokenIcon.USDC,
  },
  {
    symbol: 'APT',
    tokenId: { chain: 'Aptos', address: 'native' },
    icon: TokenIcon.APT,
    decimals: 8,
  },
  {
    symbol: 'USDC',
    decimals: 6,
    tokenId: {
      chain: 'Aptos',
      address:
        '0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832',
    },
    icon: TokenIcon.USDC,
  },
  {
    symbol: 'KLAY',
    icon: TokenIcon.KLAY,
    decimals: 18,
    tokenId: { chain: 'Klaytn', address: 'native' },
  },
  {
    symbol: 'WKLAY',
    name: 'wKLAY',
    icon: TokenIcon.KLAY,
    decimals: 18,
    tokenId: {
      chain: 'Klaytn',
      address: '0x0339d5Eb6D195Ba90B13ed1BCeAa97EbD198b106',
    },
  },
  {
    symbol: 'ETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: { chain: 'Sepolia', address: 'native' },
  },
  {
    symbol: 'WETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: {
      chain: 'Sepolia',
      address: '0xeef12A83EE5b7161D3873317c8E0E7B76e0B5D9c',
    },
  },
  {
    symbol: 'USDC',
    icon: TokenIcon.USDC,
    decimals: 6,
    tokenId: {
      chain: 'Sepolia',
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    },
  },
  {
    symbol: 'ETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: { chain: 'ArbitrumSepolia', address: 'native' },
  },
  {
    symbol: 'WETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: {
      chain: 'ArbitrumSepolia',
      address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    },
  },
  {
    symbol: 'ETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: { chain: 'BaseSepolia', address: 'native' },
  },
  {
    symbol: 'WETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: {
      chain: 'BaseSepolia',
      address: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    symbol: 'ETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: { chain: 'OptimismSepolia', address: 'native' },
  },
  {
    symbol: 'WETH',
    icon: TokenIcon.ETH,
    decimals: 18,
    tokenId: {
      chain: 'OptimismSepolia',
      address: '0x4200000000000000000000000000000000000006',
    },
  },
  {
    symbol: 'ETH',
    icon: TokenIcon.SCROLL,
    decimals: 18,
    tokenId: { chain: 'Scroll', address: 'native' },
  },
  {
    symbol: 'WETH',
    icon: TokenIcon.SCROLL,
    decimals: 18,
    tokenId: {
      chain: 'Scroll',
      address: '0x5300000000000000000000000000000000000004',
    },
  },
  {
    symbol: 'ETH',
    icon: TokenIcon.BLAST,
    decimals: 18,
    tokenId: { chain: 'Blast', address: 'native' },
  },
  {
    symbol: 'WETH',
    icon: TokenIcon.BLAST,
    decimals: 18,
    tokenId: {
      chain: 'Blast',
      address: '0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7',
    },
  },
  {
    symbol: 'OKB',
    icon: TokenIcon.XLAYER,
    decimals: 18,
    tokenId: { chain: 'Xlayer', address: 'native' },
  },
  {
    symbol: 'WOKB',
    icon: TokenIcon.XLAYER,
    decimals: 18,
    tokenId: {
      chain: 'Xlayer',
      address: '0xa2aFfd8301BfB3c5b815829f2F509f053556D21B',
    },
  },
  {
    symbol: 'MNT',
    icon: TokenIcon.MANTLE,
    decimals: 18,
    tokenId: { chain: 'Mantle', address: 'native' },
  },
  {
    symbol: 'WMNT',
    icon: TokenIcon.MANTLE,
    decimals: 18,
    tokenId: {
      chain: 'Mantle',
      address: '0xa4c4cb2A072eE99f77212Fa18c2B7Ca26DA23905',
    },
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
      address: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    },
    decimals: 6,
    icon: TokenIcon.USDC,
  },
];
