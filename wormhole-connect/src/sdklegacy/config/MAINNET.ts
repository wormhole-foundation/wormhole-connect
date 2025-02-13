import { Chain } from '@wormhole-foundation/sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

const MAINNET: { [chain in Chain]?: ChainConfig } = {
  Ethereum: {
    key: 'Ethereum',
    id: 2,
    context: Context.ETH,
  },
  Solana: {
    key: 'Solana',
    id: 1,
    context: Context.SOLANA,
  },
  Polygon: {
    key: 'Polygon',
    id: 5,
    context: Context.ETH,
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
  Arbitrum: {
    key: 'Arbitrum',
    id: 23,
    context: Context.ETH,
  },
  Optimism: {
    key: 'Optimism',
    id: 24,
    context: Context.ETH,
  },
  Base: {
    key: 'Base',
    id: 30,
    context: Context.ETH,
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
  Mantle: {
    key: 'Mantle',
    id: 35,
    context: Context.ETH,
  },
  Xlayer: {
    key: 'Xlayer',
    id: 37,
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
 * default mainnet chain config
 */
const MAINNET_CONFIG: WormholeConfig = {
  env: 'Mainnet',
  rpcs: {
    Ethereum: 'https://rpc.ankr.com/eth',
    Solana: 'https://solana-mainnet.rpc.extrnode.com',
    Polygon: 'https://rpc.ankr.com/polygon',
    Bsc: 'https://bscrpc.com',
    Avalanche: 'https://rpc.ankr.com/avalanche',
    Fantom: 'https://rpcapi.fantom.network',
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
    Worldchain: 'https://worldchain-mainnet.g.alchemy.com/public',
    Unichain: 'https://mainnet.unichain.org',
  },
  chains: MAINNET,
};

export default MAINNET_CONFIG;
