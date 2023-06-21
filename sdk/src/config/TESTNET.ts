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
  moonbasealpha: 16,
  sui: 21,
  aptos: 22,
  sei: 32,
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
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 64,
  },
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: {
      ...CONTRACTS.TESTNET.solana,
    },
    finalityThreshold: 32,
  },
  mumbai: {
    key: 'mumbai',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.polygon,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 64,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.bsc,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 15,
  },
  fuji: {
    key: 'fuji',
    id: 6,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.avalanche,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 1,
  },
  fantom: {
    key: 'fantom',
    id: 10,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.fantom,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 1,
  },
  alfajores: {
    key: 'alfajores',
    id: 14,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.celo,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 1,
  },
  moonbasealpha: {
    key: 'moonbasealpha',
    id: 16,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.moonbeam,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 1,
  },
  sui: {
    key: 'sui',
    id: 21,
    context: Context.SUI,
    contracts: {
      ...CONTRACTS.TESTNET.sui,
      relayer:
        '0xb30040e5120f8cb853b691cb6d45981ae884b1d68521a9dc7c3ae881c0031923', // suiRelayerObjectId
      suiRelayerPackageId:
        '0x12eb7e64389d8f0e052d8bda10f46aab1dcb6efeec59decf1897708450171050',
      suiOriginalTokenBridgePackageId:
        '0x562760fc51d90d4ae1835bac3e91e0e6987d3497b06f066941d3e51f6e8d76d0',
    },
    finalityThreshold: 0,
  },
  aptos: {
    key: 'aptos',
    id: 22,
    context: Context.APTOS,
    contracts: {
      ...CONTRACTS.TESTNET.aptos,
    },
    finalityThreshold: 0,
  },
  sei: {
    key: 'sei',
    id: 32,
    context: Context.SEI,
    contracts: {
      ...CONTRACTS.TESTNET.sei,
      seiTokenTranslator:
        'sei1dkdwdvknx0qav5cp5kw68mkn3r99m3svkyjfvkztwh97dv2lm0ksj6xrak',
    },
    finalityThreshold: 0,
  },
};

const env: Environment = 'TESTNET';
const TESTNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    goerli: 'https://rpc.ankr.com/eth_goerli',
    mumbai: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    bsc: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
    fantom: 'https://rpc.ankr.com/fantom_testnet',
    alfajores: 'https://alfajores-forno.celo-testnet.org',
    solana: 'https://api.devnet.solana.com',
    moonbasealpha: 'https://rpc.api.moonbase.moonbeam.network',
    sui: 'https://fullnode.testnet.sui.io',
    aptos: 'https://fullnode.testnet.aptoslabs.com/v1',
    sei: 'https://rpc.atlantic-2.seinetwork.io',
  },
  rest: {
    sei: 'https://rest.atlantic-2.seinetwork.io',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
