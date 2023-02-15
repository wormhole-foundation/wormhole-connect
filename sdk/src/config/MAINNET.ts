import {
  Network as Environment,
  Contracts,
  CONTRACTS,
} from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

// https://book.wormhole.com/reference/contracts.html
export const MAINNET_CHAINS = {
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
    solana: 'https://api.devnet.solana.com',
    ethereum: 'https://main-light.eth.linkpool.io',
  },
  chains: MAINNET,
};

export default MAINNET_CONFIG;
