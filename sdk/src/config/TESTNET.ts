import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, Contracts } from '../types';

// https://book.wormhole.com/reference/contracts.html
export const TESTNET_CHAINS = {
  goerli: 2,
  bsc: 4,
  mumbai: 5,
  fuji: 6,
  fantom: 10,
  alfajores: 14,
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
    displayName: 'Goerli',
    explorerUrl: 'https://goerli.etherscan.io/',
    explorerName: 'Etherscan',
    gasToken: 'ETH',
    chainId: 5,
  },
  mumbai: {
    key: 'mumbai',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.polygon,
      relayer: '0x64A09E0cd839456d64c9Ab8F8AFe7C2B24b65b76',
    },
    displayName: 'Mumbai',
    explorerUrl: 'https://mumbai.polygonscan.com/',
    explorerName: 'Polygonscan',
    gasToken: 'MATIC',
    chainId: 80001,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.bsc,
      relayer: '0x3a03c903690ed20b5e087647617dd5d582375fab',
    },
    displayName: 'BSC',
    explorerUrl: 'https://testnet.bscscan.com/',
    explorerName: 'BscScan',
    gasToken: 'BNB',
    chainId: 97,
  },
  fuji: {
    key: 'fuji',
    id: 6,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.avalanche,
      relayer: '0x99a0b432b9a2bd2be70788825e3232c6f0a17f11',
    },
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
    displayName: 'Fantom',
    explorerUrl: 'https://testnet.ftmscan.com/',
    explorerName: 'FtmScan',
    gasToken: 'FTM',
    chainId: 4002,
  },
  alfajores: {
    key: 'alfajores',
    id: 14,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.celo,
      relayer: '0xe0cdc52c477028bc293a21ef172a9a8b763d2113',
    },
    displayName: 'Alfajores',
    explorerUrl: 'https://explorer.celo.org/alfajores/',
    explorerName: 'Celo Explorer',
    gasToken: 'CELO',
    chainId: 44787,
  },
};

const env: Environment = 'TESTNET';
const TESTNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    goerli: process.env.REACT_APP_GOERLI_RPC,
    mumbai: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    bsc: 'https://data-seed-prebsc-2-s3.binance.org:8545',
    fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
    fantom: 'https://endpoints.omniatech.io/v1/fantom/testnet/public',
    alfajores: 'https://alfajores-forno.celo-testnet.org',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
