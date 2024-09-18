import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, Contracts } from '../types';

/**
 * Testnet chain name to chain id mapping
 */
export const TESTNET_CHAINS = {
  solana: 1,
  bsc: 4,
  mumbai: 5,
  fuji: 6,
  fantom: 10,
  klaytn: 13,
  alfajores: 14,
  moonbasealpha: 16,
  injective: 19,
  sui: 21,
  aptos: 22,
  sei: 32,
  scroll: 34,
  mantle: 35,
  blast: 36,
  xlayer: 37,
  wormchain: 3104,
  osmosis: 20,
  cosmoshub: 4000,
  evmos: 4001,
  kujira: 4002,
  sepolia: 10002,
  arbitrum_sepolia: 10003,
  base_sepolia: 10004,
  optimism_sepolia: 10005,
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
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: {
      ...CONTRACTS.TESTNET.solana,
      relayer: '3bPRWXqtSfUaCw3S4wdgvypQtsSzcmvDeaqSqPDkncrg',
      tbtcGateway: '87MEvHZCXE3ML5rrmh5uX1FbShHmRXXS32xJDGbQ7h5t',
      cctpContracts: {
        cctpTokenMessenger: 'CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3',
        cctpMessageTransmitter: 'CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd',
      },
    },
    finalityThreshold: 32,
    nativeTokenDecimals: 9,
    cctpDomain: 5,
  },
  mumbai: {
    key: 'mumbai',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.polygon,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
      tbtcGateway: '0x91fe7128f74dbd4f031ea3d90fc5ea4dcfd81818',
      cctpContracts: {
        cctpTokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
        cctpMessageTransmitter: '0xe09A679F56207EF33F5b9d8fb4499Ec00792eA73',
        wormholeCCTP: '0x2703483B1a5a7c577e8680de9Df8Be03c6f30e3c',
        wormholeCircleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
      },
    },
    finalityThreshold: 64,
    nativeTokenDecimals: 18,
    cctpDomain: 7,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.bsc,
      relayer: '0x9563a59c15842a6f322b10f69d1dd88b41f2e97b',
    },
    finalityThreshold: 3,
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
  klaytn: {
    key: 'klaytn',
    id: 13,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.klaytn,
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
  scroll: {
    key: 'scroll',
    id: 34,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.scroll,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  mantle: {
    key: 'mantle',
    id: 35,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.mantle,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  blast: {
    key: 'blast',
    id: 36,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.blast,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  xlayer: {
    key: 'xlayer',
    id: 37,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.xlayer,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
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
  cosmoshub: {
    key: 'cosmoshub',
    id: 4000,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  evmos: {
    key: 'evmos',
    id: 4001,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    disabledAsDestination: true,
  },
  kujira: {
    key: 'kujira',
    id: 4002,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  sepolia: {
    key: 'sepolia',
    id: 10002,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.sepolia,
      cctpContracts: {
        cctpTokenMessenger: '0x9f3b8679c73c2fef8b59b4f3444d4e156fb70aa5',
        cctpMessageTransmitter: '0x7865fafc2db2093669d92c0f33aeef291086befd',
      },
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    cctpDomain: 0,
  },
  arbitrum_sepolia: {
    key: 'arbitrum_sepolia',
    id: 10003,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.arbitrum_sepolia,
      relayer: '0xae8dc4a7438801ec4edc0b035eccccf3807f4cc1'
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  base_sepolia: {
    key: 'base_sepolia',
    id: 10004,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.base_sepolia,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  optimism_sepolia: {
    key: 'optimism_sepolia',
    id: 10005,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.optimism_sepolia,
      relayer: '0xae8dc4a7438801ec4edc0b035eccccf3807f4cc1'
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  injective: {
    key: 'injective',
    id: 19,
    context: Context.COSMOS,
    contracts: {},
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
  rpcs: {
    mumbai: 'https://rpc.ankr.com/polygon_mumbai',
    bsc: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
    fantom: 'https://rpc.ankr.com/fantom_testnet',
    alfajores: 'https://alfajores-forno.celo-testnet.org',
    solana: 'https://api.devnet.solana.com',
    moonbasealpha: 'https://rpc.api.moonbase.moonbeam.network',
    sui: 'https://fullnode.testnet.sui.io',
    aptos: 'https://fullnode.testnet.aptoslabs.com/v1',
    sei: 'https://rpc.atlantic-2.seinetwork.io',
    wormchain: '',
    osmosis: 'https://rpc.osmotest5.osmosis.zone',
    cosmoshub: 'https://rpc.sentry-02.theta-testnet.polypore.xyz',
    evmos: 'https://evmos-testnet-rpc.polkachu.com',
    kujira: 'https://kujira-testnet-rpc.polkachu.com',
    injective: 'https://injective-testnet-rpc.polkachu.com',
    klaytn: 'https://rpc.ankr.com/klaytn_testnet',
    sepolia: 'https://rpc.ankr.com/eth_sepolia',
    arbitrum_sepolia: 'https://sepolia-rollup.arbitrum.io/rpc',
    base_sepolia: 'https://base-sepolia-rpc.publicnode.com',
    optimism_sepolia: 'https://sepolia.optimism.io',
    scroll: 'https://rpc.ankr.com/scroll_sepolia_testnet',
    blast: 'https://rpc.ankr.com/blast_testnet_sepolia',
    xlayer: 'https://testrpc.xlayer.tech',
    mantle: 'https://rpc.testnet.mantle.xyz',
  },
  rest: {
    sei: 'https://rest.atlantic-2.seinetwork.io',
    evmos: 'https://evmos-testnet-api.polkachu.com',
    injective: 'https://injective-testnet-api.polkachu.com',
  },
  graphql: {
    aptos: 'https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql',
  },
  chains: TESTNET,
  wormholeHosts: ['https://wormhole-v2-testnet-api.certus.one'],
};

export default TESTNET_CONFIG;
