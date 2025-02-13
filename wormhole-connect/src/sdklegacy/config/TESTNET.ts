import { Chain } from '@wormhole-foundation/sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

const TESTNET: { [chain in Chain]?: ChainConfig } = {
  Solana: {
    key: 'Solana',
    id: 1,
    context: Context.SOLANA,
  },
  Bsc: {
    key: 'Bsc',
    id: 4,
    context: Context.ETH,
  },
  Avalanche: {
    key: 'Avalanche',
    id: 6,
    context: Context.ETH,
  },
  Fantom: {
    key: 'Fantom',
    id: 10,
    context: Context.ETH,
  },
  Celo: {
    key: 'Celo',
    id: 14,
    context: Context.ETH,
  },
  Moonbeam: {
    key: 'Moonbeam',
    id: 16,
    context: Context.ETH,
  },
  Sui: {
    key: 'Sui',
    id: 21,
    context: Context.SUI,
  },
  Aptos: {
    key: 'Aptos',
    id: 22,
    context: Context.APTOS,
  },
  Klaytn: {
    key: 'Klaytn',
    id: 13,
    context: Context.ETH,
  },
  Scroll: {
    key: 'Scroll',
    id: 34,
    context: Context.ETH,
  },
  Blast: {
    key: 'Blast',
    id: 36,
    context: Context.ETH,
  },
  Xlayer: {
    key: 'Xlayer',
    id: 37,
    context: Context.ETH,
  },
  Sepolia: {
    key: 'Sepolia',
    id: 10002,
    context: Context.ETH,
  },
  ArbitrumSepolia: {
    key: 'ArbitrumSepolia',
    id: 10003,
    context: Context.ETH,
  },
  BaseSepolia: {
    key: 'BaseSepolia',
    id: 10004,
    context: Context.ETH,
  },
  OptimismSepolia: {
    key: 'OptimismSepolia',
    id: 10005,
    context: Context.ETH,
  },
  Mantle: {
    key: 'Mantle',
    id: 35,
    context: Context.ETH,
  },
  Unichain: {
    key: 'Unichain',
    id: 44,
    context: Context.ETH,
  },
  Worldchain: {
    key: 'Worldchain',
    id: 45,
    context: Context.ETH,
  },
} as const;

/**
 * default testnet chain config
 */
const TESTNET_CONFIG: WormholeConfig = {
  env: 'Testnet',
  rpcs: {
    Bsc: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    Avalanche: 'https://api.avax-test.network/ext/bc/C/rpc',
    Fantom: 'https://rpc.testnet.fantom.network',
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
    Worldchain: 'https://worldchain-sepolia.g.alchemy.com/public',
    Unichain: 'https://sepolia.unichain.org',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
