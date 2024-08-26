import { Chain } from '@wormhole-foundation/sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

const TESTNET: { [chain in Chain]?: ChainConfig } = {
  Solana: {
    key: 'Solana',
    id: 1,
    context: Context.SOLANA,
    finalityThreshold: 32,
  },
  Bsc: {
    key: 'Bsc',
    id: 4,
    context: Context.ETH,
    finalityThreshold: 3,
  },
  Avalanche: {
    key: 'Avalanche',
    id: 6,
    context: Context.ETH,
    finalityThreshold: 1,
  },
  Fantom: {
    key: 'Fantom',
    id: 10,
    context: Context.ETH,
    finalityThreshold: 1,
  },
  Celo: {
    key: 'Celo',
    id: 14,
    context: Context.ETH,
    finalityThreshold: 1,
  },
  Moonbeam: {
    key: 'Moonbeam',
    id: 16,
    context: Context.ETH,
    finalityThreshold: 1,
  },
  Sui: {
    key: 'Sui',
    id: 21,
    context: Context.SUI,
    finalityThreshold: 0,
  },
  Aptos: {
    key: 'Aptos',
    id: 22,
    context: Context.APTOS,
    finalityThreshold: 0,
  },
  Klaytn: {
    key: 'Klaytn',
    id: 13,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Scroll: {
    key: 'Scroll',
    id: 34,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Blast: {
    key: 'Blast',
    id: 36,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Xlayer: {
    key: 'Xlayer',
    id: 37,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Sepolia: {
    key: 'Sepolia',
    id: 10002,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  ArbitrumSepolia: {
    key: 'ArbitrumSepolia',
    id: 10003,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  BaseSepolia: {
    key: 'BaseSepolia',
    id: 10004,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  OptimismSepolia: {
    key: 'OptimismSepolia',
    id: 10005,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Mantle: {
    key: 'Mantle',
    id: 35,
    context: Context.ETH,
    finalityThreshold: 0,
  },
} as const;

/**
 * default testnet chain config
 */
const TESTNET_CONFIG: WormholeConfig = {
  env: 'testnet',
  rpcs: {
    Bsc: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    Avalanche: 'https://api.avax-test.network/ext/bc/C/rpc',
    Fantom: 'https://rpc.ankr.com/fantom_testnet',
    Celo: 'https://alfajores-forno.celo-testnet.org',
    Solana: 'https://api.devnet.solana.com',
    Moonbeam: 'https://rpc.api.moonbase.moonbeam.network',
    Sui: 'https://fullnode.testnet.sui.io',
    Aptos: 'https://fullnode.testnet.aptoslabs.com/v1',
    Sei: 'https://rpc.atlantic-2.seinetwork.io',
    Wormchain: '',
    Osmosis: 'https://rpc.osmotest5.osmosis.zone',
    Cosmoshub: 'https://rpc.sentry-02.theta-testnet.polypore.xyz',
    Evmos: 'https://evmos-testnet-rpc.polkachu.com',
    Kujira: 'https://kujira-testnet-rpc.polkachu.com',
    Injective: 'https://injective-testnet-rpc.polkachu.com',
    Klaytn: 'https://rpc.ankr.com/klaytn_testnet',
    Sepolia: 'https://rpc.ankr.com/eth_sepolia',
    ArbitrumSepolia: 'https://sepolia-rollup.arbitrum.io/rpc',
    BaseSepolia: 'https://base-sepolia-rpc.publicnode.com',
    OptimismSepolia: 'https://sepolia.optimism.io',
    Scroll: 'https://rpc.ankr.com/scroll_sepolia_testnet',
    Blast: 'https://rpc.ankr.com/blast_testnet_sepolia',
    Xlayer: 'https://testrpc.xlayer.tech',
    Mantle: 'https://rpc.sepolia.mantle.xyz',
  },
  rest: {
    Sei: 'https://rest.atlantic-2.seinetwork.io',
    Evmos: 'https://evmos-testnet-api.polkachu.com',
    Injective: 'https://injective-testnet-api.polkachu.com',
  },
  graphql: {
    Aptos: 'https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql',
  },
  chains: TESTNET,
  wormholeHosts: ['https://wormhole-v2-testnet-api.certus.one'],
};

export default TESTNET_CONFIG;
