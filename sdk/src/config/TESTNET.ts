import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, Contracts } from '../types';

/**
 * Testnet chain name to chain id mapping
 */
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
  arbitrumgoerli: 23,
  optimismgoerli: 24,
  basegoerli: 30,
  sei: 32,
  wormchain: 3104,
  osmosis: 20,
} as const;

/**
 * testnet chain name type
 */
export type TestnetChainName = keyof typeof TESTNET_CHAINS;
/**
 * testnet chain id type
 */
export type TestnetChainId = (typeof TESTNET_CHAINS)[TestnetChainName];
/**
 * chain name to contracts mapping
 */
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
      cctpContracts: {
        cctpTokenMessenger: '0xd0c3da58f55358142b8d3e06c1c30c5c6114efe8',
        cctpMessageTransmitter: '0x26413e8157cd32011e726065a5462e97dd4d03d9',
        wormholeCircleRelayer: '0x17da1ff5386d044c63f00747b5b8ad1e3806448d',
        wormholeCCTP: '0x0a69146716b3a21622287efa1607424c663069a4',
      },
    },
    finalityThreshold: 64,
    nativeTokenDecimals: 18,
    cctpDomain: 0,
  },
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: {
      ...CONTRACTS.TESTNET.solana,
      relayer: '3bPRWXqtSfUaCw3S4wdgvypQtsSzcmvDeaqSqPDkncrg',
    },
    finalityThreshold: 32,
    nativeTokenDecimals: 9,
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
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 18,
  },
  fuji: {
    key: 'fuji',
    id: 6,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.avalanche,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
      cctpContracts: {
        cctpTokenMessenger: '0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0',
        cctpMessageTransmitter: '0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79',
        wormholeCircleRelayer: '0x774a70bbd03327c21460b60f25b677d9e46ab458',
        wormholeCCTP: '0x58f4c17449c90665891c42e14d34aae7a26a472e',
      },
    },
    finalityThreshold: 1,
    nativeTokenDecimals: 18,
    cctpDomain: 1,
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
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 9,
  },
  aptos: {
    key: 'aptos',
    id: 22,
    context: Context.APTOS,
    contracts: {
      ...CONTRACTS.TESTNET.aptos,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 8,
  },
  arbitrumgoerli: {
    key: 'arbitrumgoerli',
    id: 23,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.arbitrum,
      cctpContracts: {
        cctpTokenMessenger: '0x12dcfd3fe2e9eac2859fd1ed86d2ab8c5a2f9352',
        cctpMessageTransmitter: '0x109bc137cb64eab7c0b1dddd1edf341467dc2d35',
        wormholeCircleRelayer: '0xbf683d541e11320418ca78ec13309938e6c5922f',
        wormholeCCTP: '0x2e8f5e00a9c5d450a72700546b89e2b70dfb00f2',
      },
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    cctpDomain: 3,
  },
  optimismgoerli: {
    key: 'optimismgoerli',
    id: 24,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.optimism,
      cctpContracts: {
        cctpTokenMessenger: '0x23a04d5935ed8bc8e3eb78db3541f0abfb001c6e',
        cctpMessageTransmitter: '0x9ff9a4da6f2157a9c82ce756f8fd7e0d75be8895',
        wormholeCircleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
        wormholeCCTP: '0x2703483B1a5a7c577e8680de9Df8Be03c6f30e3c',
      },
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    cctpDomain: 2,
  },
  basegoerli: {
    key: 'basegoerli',
    id: 30,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.base,
      relayer: '0xae8dc4a7438801ec4edc0b035eccccf3807f4cc1',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 6,
  },
  wormchain: {
    context: Context.COSMOS,
    key: 'wormchain',
    id: 3104,
    contracts: {
      core: 'wormhole16jzpxp0e8550c9aht6q9svcux30vtyyyyxv5w2l2djjra46580wsazcjwp',
      token_bridge:
        'wormhole1aaf9r6s7nxhysuegqrxv0wpm27ypyv4886medd3mrkrw6t4yfcnst3qpex',
      ibcShimContract:
        'wormhole1ctnjk7an90lz5wjfvr3cf6x984a8cjnv8dpmztmlpcq4xteaa2xs9pwmzk',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  osmosis: {
    key: 'osmosis',
    id: 20,
    context: Context.COSMOS,
    contracts: {
      core: '',
      token_bridge: '',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
};

const env: Environment = 'TESTNET';
/**
 * default testnet chain config
 */
const TESTNET_CONFIG: WormholeConfig = {
  env,
  rpc: {
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
    arbitrumgoerli: 'https://arbitrum-goerli.publicnode.com',
    optimismgoerli: 'https://optimism-goerli.publicnode.com',
    basegoerli: 'https://goerli.base.org',
    sei: 'https://rpc.atlantic-2.seinetwork.io',
    wormchain: '',
    osmosis: 'https://rpc.osmotest5.osmosis.zone',
  },
  rest: {
    sei: 'https://rest.atlantic-2.seinetwork.io',
  },
  chains: TESTNET,
  wormholeHosts: ['https://wormhole-v2-testnet-api.certus.one'],
};

export default TESTNET_CONFIG;
