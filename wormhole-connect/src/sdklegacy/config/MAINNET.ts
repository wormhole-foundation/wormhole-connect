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
  Berachain: {
    key: 'Berachain',
    id: 39,
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
    Ethereum: 'https://ethereum-rpc.publicnode.com',
    Solana: 'https://solana-rpc.publicnode.com',
    Polygon: 'https://polygon-bor-rpc.publicnode.com',
    Bsc: 'https://bscrpc.com',
    Avalanche: 'https://avalanche-c-chain-rpc.publicnode.com',
    Fantom: 'https://rpcapi.fantom.network',
    Celo: 'https://celo-rpc.publicnode.com',
    Moonbeam: 'https://moonbeam-rpc.publicnode.com',
    Sui: 'https://rpc.mainnet.sui.io',
    Aptos: 'https://fullnode.mainnet.aptoslabs.com/v1',
    Arbitrum: 'https://arbitrum-one-rpc.publicnode.com',
    Optimism: 'https://optimism-rpc.publicnode.com',
    Base: 'https://base.publicnode.com',
    Sei: '', // TODO: fill in
    Wormchain: 'https://wormchain-rpc.quickapi.com',
    Osmosis: 'https://osmosis-rpc.polkachu.com',
    Cosmoshub: 'https://cosmos-rpc.polkachu.com',
    Evmos: 'https://evmos-rpc.polkachu.com',
    Kujira: 'https://kujira-rpc.polkachu.com',
    Injective: 'https://injective-rpc.publicnode.com/', // TODO: use the library to get the correct rpc https://docs.ts.injective.network/querying/querying-api/querying-indexer-explorer#fetch-transaction-using-transaction-hash
    Klaytn: 'https://public-en.node.kaia.io',
    Scroll: 'https://scroll-rpc.publicnode.com',
    Blast: 'https://blast-rpc.publicnode.com',
    Xlayer: 'https://rpc.xlayer.tech',
    Mantle: 'https://rpc.mantle.xyz',
    Worldchain: 'https://worldchain-mainnet.g.alchemy.com/public',
    Unichain: 'https://mainnet.unichain.org',
    Berachain: 'https://rpc.berachain.com',
  },
  chains: MAINNET,
};

export default MAINNET_CONFIG;
