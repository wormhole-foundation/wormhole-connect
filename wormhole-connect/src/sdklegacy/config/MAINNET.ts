import { Chain } from '@wormhole-foundation/sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

const MAINNET: { [chain in Chain]?: ChainConfig } = {
  Ethereum: {
    key: 'Ethereum',
    id: 2,
    context: Context.ETH,
    finalityThreshold: 64,
  },
  Solana: {
    key: 'Solana',
    id: 1,
    context: Context.SOLANA,
    finalityThreshold: 32,
  },
  Polygon: {
    key: 'Polygon',
    id: 5,
    context: Context.ETH,
    finalityThreshold: 42,
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
  Arbitrum: {
    key: 'Arbitrum',
    id: 23,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Optimism: {
    key: 'Optimism',
    id: 24,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Base: {
    key: 'Base',
    id: 30,
    context: Context.ETH,
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
  Mantle: {
    key: 'Mantle',
    id: 35,
    context: Context.ETH,
    finalityThreshold: 0,
  },
  Xlayer: {
    key: 'Xlayer',
    id: 37,
    context: Context.ETH,
    finalityThreshold: 0,
  },
} as const;

/**
 * default mainnet chain config
 */
const MAINNET_CONFIG: WormholeConfig = {
  env: 'mainnet',
  rpcs: {
    Ethereum: 'https://rpc.ankr.com/eth',
    Solana: 'https://solana-mainnet.rpc.extrnode.com',
    Polygon: 'https://rpc.ankr.com/polygon',
    Bsc: 'https://bscrpc.com',
    Avalanche: 'https://rpc.ankr.com/avalanche',
    Fantom: 'https://rpc.ankr.com/fantom',
    Celo: 'https://rpc.ankr.com/celo',
    Moonbeam: 'https://rpc.ankr.com/moonbeam',
    Sui: 'https://rpc.mainnet.sui.io',
    Aptos: 'https://fullnode.mainnet.aptoslabs.com/v1',
    Arbitrum: 'https://rpc.ankr.com/arbitrum',
    Optimism: 'https://rpc.ankr.com/optimism',
    Base: 'https://base.publicnode.com',
    Sei: '', // TODO: fill in
    Wormchain: 'https://wormchain-rpc.quickapi.com',
    Osmosis: 'https://osmosis-rpc.polkachu.com',
    Cosmoshub: 'https://cosmos-rpc.polkachu.com',
    Evmos: 'https://evmos-rpc.polkachu.com',
    Kujira: 'https://kujira-rpc.polkachu.com',
    Injective: 'https://injective-rpc.publicnode.com/', // TODO: use the library to get the correct rpc https://docs.ts.injective.network/querying/querying-api/querying-indexer-explorer#fetch-transaction-using-transaction-hash
    Klaytn: 'https://rpc.ankr.com/klaytn',
    Scroll: 'https://rpc.ankr.com/scroll',
    Blast: 'https://rpc.ankr.com/blast',
    Xlayer: 'https://rpc.xlayer.tech',
    Mantle: 'https://rpc.mantle.xyz',
  },
  rest: {
    Sei: '',
    Evmos: 'https://evmos-api.polkachu.com',
    Injective: 'https://injective-api.polkachu.com',
  },
  graphql: {
    Aptos: 'https://indexer.mainnet.aptoslabs.com/v1/graphql',
  },
  chains: MAINNET,
  wormholeHosts: [
    'https://wormhole-v2-mainnet-api.certus.one',
    'https://wormhole-v2-mainnet-api.mcf.rocks',
    'https://wormhole-v2-mainnet-api.chainlayer.network',
    'https://wormhole-v2-mainnet-api.staking.fund',
  ],
};

export default MAINNET_CONFIG;
