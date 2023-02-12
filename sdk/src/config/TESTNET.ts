import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, Contracts } from '../types';

// https://book.wormhole.com/reference/contracts.html
export const TESTNET_CHAINS = {
  solana: 1,
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
      relayer: '0xe32b14c48e4b7c6825b855f231786fe5ba9ce014',
    },
    displayName: 'Goerli',
    explorerUrl: 'https://goerli.etherscan.io/',
    explorerName: 'Etherscan',
    gasToken: 'ETH',
    chainId: 5,
  },
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: {
      ...CONTRACTS.TESTNET.solana,
    },
    displayName: 'Solana',
    explorerUrl: 'https://explorer.solana.com/?cluster=testnet/',
    explorerName: 'Solana Explorer',
    gasToken: 'SOL',
    chainId: 0,
  },
  mumbai: {
    key: 'mumbai',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.polygon,
      relayer: '0x953a2342496b15d69dec25c8e62274995e82d243',
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
      relayer: '0x49a401f7fa594bc618a7a39b316b78e329620103',
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
      relayer: '0x8369839932222c1ca3bc7d16f970c56f61993a44',
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
      relayer: '0x5122298f68341a088c5370d7678e13912e4ed378',
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
      relayer: '0x5c9da01cbf5088ee660b9701dc526c6e5df1c239',
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
    goerli:
      process.env.REACT_APP_GOERLI_RPC || 'https://rpc.ankr.com/eth_goerli',
    mumbai:
      process.env.REACT_APP_MUMBAI_RPC ||
      'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    bsc:
      process.env.REACT_APP_BSC_RPC ||
      'https://data-seed-prebsc-2-s3.binance.org:8545',
    fuji:
      process.env.REACT_APP_FUJI_RPC ||
      'https://api.avax-test.network/ext/bc/C/rpc',
    fantom:
      process.env.REACT_APP_FANTOM_RPC || 'https://rpc.ankr.com/fantom_testnet',
    alfajores:
      process.env.REACT_APP_ALFAJORES_RPC ||
      'https://alfajores-forno.celo-testnet.org',
    solana:
      process.env.REACT_APP_SOLANA_RPC || 'https://api.testnet.solana.com',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
