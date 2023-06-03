import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, Contracts } from '../types';

// https://book.wormhole.com/reference/contracts.html
export const MAINNET_CHAINS = {
  solana: 1,
  ethereum: 2,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  fantom: 10,
  celo: 14,
  moonbeam: 16,
  sui: 21,
  aptos: 22,
  sei: 32,
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
    contracts: {
      ...CONTRACTS.MAINNET.ethereum,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
    },
    finalityThreshold: 64,
  },
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: CONTRACTS.MAINNET.solana,
    finalityThreshold: 32,
  },
  polygon: {
    key: 'polygon',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.polygon,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
    },
    finalityThreshold: 512,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.bsc,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
    },
    finalityThreshold: 15,
  },
  avalanche: {
    key: 'avalanche',
    id: 6,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.avalanche,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
    },
    finalityThreshold: 1,
  },
  fantom: {
    key: 'fantom',
    id: 10,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.fantom,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
    },
    finalityThreshold: 1,
  },
  celo: {
    key: 'celo',
    id: 14,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.celo,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
    },
    finalityThreshold: 1,
  },
  moonbeam: {
    key: 'moonbeam',
    id: 16,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.moonbeam,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
    },
    finalityThreshold: 1,
  },
  sui: {
    key: 'sui',
    id: 21,
    context: Context.SUI,
    contracts: {
      ...CONTRACTS.MAINNET.sui,
      relayer:
        '0x57f4e0ba41a7045e29d435bc66cc4175f381eb700e6ec16d4fdfe92e5a4dff9f',
      suiRelayerPackageId:
        '0x38035f4c1e1772d43a3535535ea5b29c1c3ab2c0026d4ad639969831bd1d174d',
      suiOriginalTokenBridgePackageId:
        '0x26efee2b51c911237888e5dc6702868abca3c7ac12c53f76ef8eba0697695e3d',
    },
    finalityThreshold: 0,
  },
  aptos: {
    key: 'aptos',
    id: 22,
    context: Context.APTOS,
    contracts: CONTRACTS.MAINNET.aptos,
    finalityThreshold: 0,
  },
  sei: {
    key: 'sei',
    id: 32,
    context: Context.SEI,
    contracts: {
      ...CONTRACTS.MAINNET.sei,
      core: '',
      token_bridge: '',
      nft_bridge: undefined,
    },
    finalityThreshold: 0, // TODO: update
  },
};

const env: Environment = 'MAINNET';
const MAINNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    ethereum: 'https://rpc.ankr.com/eth',
    solana: 'https://api.mainnet-beta.solana.com',
    polygon: 'https://rpc.ankr.com/polygon',
    bsc: 'https://bscrpc.com',
    avalanche: 'https://rpc.ankr.com/avalanche',
    fantom: 'https://rpc.ankr.com/fantom',
    celo: 'https://rpc.ankr.com/celo',
    moonbeam: 'https://rpc.ankr.com/moonbeam',
    sui: 'https://rpc.mainnet.sui.io',
    aptos: 'https://fullnode.mainnet.aptoslabs.com/v1',
    sei: '', // TODO: fill in
  },
  rest: {
    sei: '',
  },
  chains: MAINNET,
};

export default MAINNET_CONFIG;
