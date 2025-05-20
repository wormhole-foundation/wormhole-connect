import { Chain } from '@wormhole-foundation/sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

const TESTNET: { [chain in Chain]?: ChainConfig } = {
  Solana: {
    key: 'Solana',
    context: Context.SOLANA,
  },
  Bsc: {
    key: 'Bsc',
    context: Context.ETH,
  },
  Avalanche: {
    key: 'Avalanche',
    context: Context.ETH,
  },
  Fantom: {
    key: 'Fantom',
    context: Context.ETH,
  },
  Celo: {
    key: 'Celo',
    context: Context.ETH,
  },
  Moonbeam: {
    key: 'Moonbeam',
    context: Context.ETH,
  },
  Sui: {
    key: 'Sui',
    context: Context.SUI,
  },
  Aptos: {
    key: 'Aptos',
    context: Context.APTOS,
  },
  Klaytn: {
    key: 'Klaytn',
    context: Context.ETH,
  },
  Scroll: {
    key: 'Scroll',
    context: Context.ETH,
  },
  Blast: {
    key: 'Blast',
    context: Context.ETH,
  },
  Xlayer: {
    key: 'Xlayer',
    context: Context.ETH,
  },
  Sepolia: {
    key: 'Sepolia',
    context: Context.ETH,
  },
  ArbitrumSepolia: {
    key: 'ArbitrumSepolia',
    context: Context.ETH,
  },
  BaseSepolia: {
    key: 'BaseSepolia',
    context: Context.ETH,
  },
  OptimismSepolia: {
    key: 'OptimismSepolia',
    context: Context.ETH,
  },
  Mantle: {
    key: 'Mantle',
    context: Context.ETH,
  },
  Unichain: {
    key: 'Unichain',
    context: Context.ETH,
  },
  Worldchain: {
    key: 'Worldchain',
    context: Context.ETH,
  },
  Mezo: {
    key: 'Mezo',
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
    Klaytn: 'https://public-en-kairos.node.kaia.io',
    Sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
    ArbitrumSepolia: 'https://sepolia-rollup.arbitrum.io/rpc',
    BaseSepolia: 'https://base-sepolia-rpc.publicnode.com',
    OptimismSepolia: 'https://sepolia.optimism.io',
    Scroll: 'https://scroll-sepolia-rpc.publicnode.com',
    Blast: 'https://sepolia.blast.io',
    Xlayer: 'https://testrpc.xlayer.tech',
    Mantle: 'https://rpc.sepolia.mantle.xyz',
    Worldchain: 'https://worldchain-sepolia.g.alchemy.com/public',
    Unichain: 'https://sepolia.unichain.org',
    Mezo: 'https://rpc.test.mezo.org',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
