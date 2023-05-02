import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, Contracts } from '../types';

// https://book.wormhole.com/reference/contracts.html
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
} as const;

export type TestnetChainName = keyof typeof TESTNET_CHAINS;
export type TestnetChainId = (typeof TESTNET_CHAINS)[TestnetChainName];

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
      relayer: '0xe32b14c48e4b7c6825b855f231786fe5ba9ce014',
    },
    finalityThreshold: 15,
  },
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: {
      ...CONTRACTS.TESTNET.solana,
    },
    finalityThreshold: 32,
  },
  mumbai: {
    key: 'mumbai',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.polygon,
      relayer: '0x953a2342496b15d69dec25c8e62274995e82d243',
    },
    finalityThreshold: 64,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.bsc,
      relayer: '0x49a401f7fa594bc618a7a39b316b78e329620103',
    },
    finalityThreshold: 15,
  },
  fuji: {
    key: 'fuji',
    id: 6,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.avalanche,
      relayer: '0x8369839932222c1ca3bc7d16f970c56f61993a44',
    },
    finalityThreshold: 0,
  },
  fantom: {
    key: 'fantom',
    id: 10,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.fantom,
      relayer: '0x5122298f68341a088c5370d7678e13912e4ed378',
    },
    finalityThreshold: 1,
  },
  alfajores: {
    key: 'alfajores',
    id: 14,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.celo,
      relayer: '0x5c9da01cbf5088ee660b9701dc526c6e5df1c239',
    },
    finalityThreshold: 1,
  },
  moonbasealpha: {
    key: 'moonbasealpha',
    id: 16,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.TESTNET.moonbeam,
      relayer: '0xa098368aaadc0fdf3e309cda710d7a5f8bdeecd9',
    },
    finalityThreshold: 1,
  },
  sui: {
    key: 'sui',
    id: 21,
    context: Context.SUI,
    contracts: {
      ...CONTRACTS.TESTNET.sui,
      core: '0x69ae41bdef4770895eb4e7aaefee5e4673acc08f6917b4856cf55549c4573ca8',
      token_bridge:
        '0x32422cb2f929b6a4e3f81b4791ea11ac2af896b310f3d9442aa1fe924ce0bab4',
      nft_bridge: undefined,
      relayer:
        '0xe7e7bf3994f63d1eb58896411d1c211d280cc6182cb2a29bf95ce8f338431523', // suiRelayerObjectId
      suiRelayerPackageId:
        '0x683696ce7d22989c880452c93fc608e4decd1dcbe1e9e1960a142be0544c3ff1',
      suiOriginalTokenBridgePackageId:
        '0x92d81f28c167d90f84638c654b412fe7fa8e55bdfac7f638bdcf70306289be86',
    },
    finalityThreshold: 0,
  },
};

const env: Environment = 'TESTNET';
const TESTNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    goerli: 'https://rpc.ankr.com/eth_goerli',
    mumbai: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    bsc: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
    fantom: 'https://rpc.ankr.com/fantom_testnet',
    alfajores: 'https://alfajores-forno.celo-testnet.org',
    solana: 'https://api.devnet.solana.com',
    moonbasealpha: 'https://rpc.api.moonbase.moonbeam.network',
    sui: 'https://fullnode.testnet.sui.io',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
