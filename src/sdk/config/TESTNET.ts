import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import {
  WormholeConfig,
  Context,
  ChainConfig,
  TokenConfig,
  Contracts,
} from '../types';

import EthIcon from '../../icons/tokens/eth.svg';
import BscIcon from '../../icons/tokens/bsc.svg';
import FujiIcon from '../../icons/tokens/avax.svg';
import FantomIcon from '../../icons/tokens/fantom.svg';
import MaticIcon from '../../icons/tokens/polygon.svg';
import USDCIcon from '../../icons/tokens/usdc.svg';
import CeloIcon from '../../icons/tokens/celo.svg';

// https://book.wormhole.com/reference/contracts.html
export const TESTNET_CHAINS = {
  goerli: 2,
  bsc: 4,
  polygon: 5,
  fuji: 6,
  fantom: 10,
  celo: 14,
} as const;

export type TestnetChainName = keyof typeof TESTNET_CHAINS;
export type TestnetChainId = (typeof TESTNET_CHAINS)[TestnetChainName];

export type ChainContracts = {
  [chain in TestnetChainName]: Contracts;
};

const TESTNET: { [chain in TestnetChainName]: ChainConfig } = {
  goerli: {
    key: 'goerli',
    id: 2,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.ethereum,
      relayer: '0x631C7bc094895b35E15EA23CDe5b2BdC74Ed18bf',
    },
    icon: EthIcon,
    displayName: 'Goerli',
    explorerUrl: 'https://goerli.etherscan.io/',
    explorerName: 'Etherscan',
    gasToken: 'ETH',
    chainId: 5,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.bsc,
      relayer: '0x3a03c903690ed20b5e087647617dd5d582375fab',
    },
    icon: BscIcon,
    displayName: 'BSC',
    explorerUrl: 'https://testnet.bscscan.com/',
    explorerName: 'BscScan',
    gasToken: 'BNB',
    chainId: 97,
  },
  polygon: {
    key: 'polygon',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.polygon,
      relayer: '0x64A09E0cd839456d64c9Ab8F8AFe7C2B24b65b76',
    },
    icon: MaticIcon,
    displayName: 'Polygon',
    explorerUrl: 'https://polygonscan.com/',
    explorerName: 'Polygonscan',
    gasToken: 'MATIC',
    chainId: 0,
  },
  fuji: {
    key: 'fuji',
    id: 6,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.avalanche,
      relayer: '0x99a0b432b9a2bd2be70788825e3232c6f0a17f11',
    },
    icon: FujiIcon,
    displayName: 'Fuji',
    explorerUrl: 'https://testnet.snowtrace.io/',
    explorerName: 'Snowtrace',
    gasToken: 'AVAX',
    chainId: 43113,
  },
  fantom: {
    key: 'fantom',
    id: 10,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.fantom,
      relayer: '0x4cb9c625e657d9ccb91fa2270f420d005e2715d2',
    },
    icon: FantomIcon,
    displayName: 'Fantom',
    explorerUrl: 'https://testnet.ftmscan.com/',
    explorerName: 'FtmScan',
    gasToken: 'FTM',
    chainId: 4002,
  },
  celo: {
    key: 'celo',
    id: 14,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.celo,
      relayer: '0xe0cdc52c477028bc293a21ef172a9a8b763d2113',
    },
    icon: CeloIcon,
    displayName: 'Celo',
    explorerUrl: 'https://explorer.celo.org/mainnet/',
    explorerName: 'Celo Explorer',
    gasToken: 'CELO',
    chainId: 42220,
  },
};

export const TESTNET_TOKENS: { [key: string]: TokenConfig } = {
  ETH: {
    symbol: 'ETH',
    icon: EthIcon,
    address:
      '0x000000000000000000000000B4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    coinGeckoId: 'ethereum',
    color: '#62688F',
  },
  BNB: {
    symbol: 'BNB',
    icon: BscIcon,
    address:
      '0x000000000000000000000000ae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    coinGeckoId: 'bnb',
    color: '#F3BA30',
  },
  USDC: {
    symbol: 'USDC',
    icon: USDCIcon,
    address:
      '0x0000000000000000000000005425890298aed601595a70AB815c96711a31Bc65',
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
  },
  AVAX: {
    symbol: 'AVAX',
    icon: FujiIcon,
    address:
      '0x000000000000000000000000d00ae08403B9bbb9124bB305C09058E32C39A48c',
    coinGeckoId: 'avalanche',
    color: '#E84141',
  },
  FTM: {
    symbol: 'FTM',
    icon: FantomIcon,
    address:
      '0x000000000000000000000000f1277d1Ed8AD466beddF92ef448A132661956621',
    coinGeckoId: 'fantom',
    color: '#12B4EC',
  },
  MATIC: {
    symbol: 'MATIC',
    icon: MaticIcon,
    address:
      '0x0000000000000000000000009c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    coinGeckoId: 'polygon',
    color: '#8247E5',
  },
  CELO: {
    symbol: 'CELO',
    icon: CeloIcon,
    address:
      '0x000000000000000000000000F194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    coinGeckoId: 'celo',
    color: '#35D07E',
  },
};

const env: Environment = 'TESTNET';
const TESTNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    goerli: process.env.REACT_APP_GOERLI_RPC,
    bsc: 'https://data-seed-prebsc-2-s3.binance.org:8545',
    fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
    fantom: 'https://rpc.testnet.fantom.network',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
