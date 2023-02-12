import {
  Network as Environment,
  Contracts,
  CONTRACTS,
} from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

// https://book.wormhole.com/reference/contracts.html
export const MAINNET_CHAINS = {
  solana: 1,
  ethereum: 2,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  fantom: 10,
  celo: 14,
} as const;

export type MainnetChainName = keyof typeof MAINNET_CHAINS;
export type MainnetChainId = (typeof MAINNET_CHAINS)[MainnetChainName];

export type ChainContracts = {
  [chain in MainnetChainName]: Contracts;
};

const MAINNET: { [chain in MainnetChainName]: ChainConfig } = {
  ethereum: {
    key: 'ethereum',
    id: 2,
    context: Context.ETH,
    contracts: CONTRACTS.MAINNET.ethereum,
    displayName: 'Ethereum',
    explorerUrl: 'https://etherscan.io/',
    explorerName: 'Etherscan',
    gasToken: 'ETH',
    chainId: 1,
  },
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: CONTRACTS.MAINNET.solana,
    displayName: 'Solana',
    explorerUrl: 'https://explorer.solana.com/',
    explorerName: 'Solana Explorer',
    gasToken: 'SOL',
    chainId: 0,
  },
  polygon: {
    key: 'polygon',
    id: 5,
    context: Context.ETH,
    contracts: CONTRACTS.MAINNET.polygon,
    displayName: 'Polygon',
    explorerUrl: 'https://polygonscan.com/',
    explorerName: 'PolygonScan',
    gasToken: 'MATIC',
    chainId: 137,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: CONTRACTS.MAINNET.bsc,
    displayName: 'BSC',
    explorerUrl: 'https://bscscan.com/',
    explorerName: 'BscScan',
    gasToken: 'BNB',
    chainId: 56,
  },
  avalanche: {
    key: 'avalanche',
    id: 6,
    context: Context.ETH,
    contracts: CONTRACTS.MAINNET.avalanche,
    displayName: 'Avalanche',
    explorerUrl: 'https://snowtrace.io/',
    explorerName: 'Snowtrace',
    gasToken: 'WAVAX',
    chainId: 43114,
  },
  fantom: {
    key: 'fantom',
    id: 10,
    context: Context.ETH,
    contracts: CONTRACTS.MAINNET.fantom,
    displayName: 'Fantom',
    explorerUrl: 'https://ftmscan.com/',
    explorerName: 'FTMscan',
    gasToken: 'FTM',
    chainId: 250,
  },
  celo: {
    key: 'celo',
    id: 14,
    context: Context.ETH,
    contracts: CONTRACTS.MAINNET.celo,
    displayName: 'Celo',
    explorerUrl: 'https://explorer.celo.org/mainnet/',
    explorerName: 'Celo Explorer',
    gasToken: 'CELO',
    chainId: 42220,
  },
};

const env: Environment = 'MAINNET';
const MAINNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    ethereum: process.env.REACT_APP_ETHEREUM_RPC || 'https://rpc.ankr.com/eth',
    solana:
      process.env.REACT_APP_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    polygon:
      process.env.REACT_APP_POLYGON_RPC || 'https://rpc.ankr.com/polygon',
    bsc: process.env.REACT_APP_BSC_RPC || 'https://bscrpc.com',
    avalanche:
      process.env.REACT_APP_AVALANCHE_RPC || 'https://rpc.ankr.com/avalanche',
    fantom: process.env.REACT_APP_FANTOM_RPC || 'https://rpc.ankr.com/fantom',
    celo: process.env.REACT_APP_CELO_RPC || 'https://rpc.ankr.com/celo',
  },
  chains: MAINNET,
};

export default MAINNET_CONFIG;
