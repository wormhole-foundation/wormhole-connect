import { Network as Environment, CONTRACTS } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, Contracts } from '../types';

/**
 * Mainnet chain name to chain id mapping
 */
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
  arbitrum: 23,
  optimism: 24,
  base: 30,
  sei: 32,
  wormchain: 3104,
  osmosis: 20,
} as const;

/**
 * mainnet chain name type
 */
export type MainnetChainName = keyof typeof MAINNET_CHAINS;
/**
 * mainnet chain id type
 */
export type MainnetChainId = (typeof MAINNET_CHAINS)[MainnetChainName];

/**
 * chain name to contracts mapping
 */
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
      cctpContracts: {
        cctpTokenMessenger: '0xbd3fa81b58ba92a82136038b25adec7066af3155',
        cctpMessageTransmitter: '0x0a992d191deec32afe36203ad87d7d289a738f81',
        wormholeCircleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
        wormholeCCTP: '0xAaDA05BD399372f0b0463744C09113c137636f6a',
      },
      hashflow: '0x55084eE0fEf03f14a305cd24286359A35D735151',
    },
    finalityThreshold: 64,
    nativeTokenDecimals: 18,
    cctpDomain: 0,
  },
  solana: {
    key: 'solana',
    id: 1,
    context: Context.SOLANA,
    contracts: {
      ...CONTRACTS.MAINNET.solana,
      relayer: '3vxKRPwUTiEkeUVyoZ9MXFe1V71sRLbLqu1gRYaWmehQ',
    },
    finalityThreshold: 32,
    nativeTokenDecimals: 9,
  },
  polygon: {
    key: 'polygon',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.polygon,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
      hashflow: '0x55084eE0fEf03f14a305cd24286359A35D735151',
    },
    finalityThreshold: 512,
    nativeTokenDecimals: 18,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.bsc,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
      hashflow: '0x55084eE0fEf03f14a305cd24286359A35D735151',
    },
    finalityThreshold: 15,
    nativeTokenDecimals: 18,
  },
  avalanche: {
    key: 'avalanche',
    id: 6,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.avalanche,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
      cctpContracts: {
        cctpTokenMessenger: '0x6b25532e1060ce10cc3b0a99e5683b91bfde6982',
        cctpMessageTransmitter: '0x8186359af5f57fbb40c6b14a588d2a59c0c29880',
        wormholeCircleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
        wormholeCCTP: '0x09Fb06A271faFf70A651047395AaEb6265265F13',
      },
      hashflow: '0x55084eE0fEf03f14a305cd24286359A35D735151',
    },
    finalityThreshold: 1,
    nativeTokenDecimals: 18,
    cctpDomain: 1,
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
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 18,
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
    nativeTokenDecimals: 9,
  },
  aptos: {
    key: 'aptos',
    id: 22,
    context: Context.APTOS,
    contracts: CONTRACTS.MAINNET.aptos,
    finalityThreshold: 0,
    nativeTokenDecimals: 8,
  },
  arbitrum: {
    key: 'arbitrum',
    id: 23,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.arbitrum,
      cctpContracts: {
        cctpTokenMessenger: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
        cctpMessageTransmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
        wormholeCircleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
        wormholeCCTP: '0x2703483b1a5a7c577e8680de9df8be03c6f30e3c',
      },
      hashflow: '0x55084eE0fEf03f14a305cd24286359A35D735151',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    cctpDomain: 3,
  },
  optimism: {
    key: 'optimism',
    id: 24,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.optimism,
      cctpContracts: {
        cctpTokenMessenger: '0x2B4069517957735bE00ceE0fadAE88a26365528f',
        cctpMessageTransmitter: '0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8',
        wormholeCircleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
        wormholeCCTP: '0x2703483b1a5a7c577e8680de9df8be03c6f30e3c',
      },
      hashflow: '0xCa310B1B942A30Ff4b40a5E1b69AB4607eC79Bc1',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    cctpDomain: 2,
  },
  base: {
    key: 'base',
    id: 30,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.base,
      relayer: undefined,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  sei: {
    key: 'sei',
    id: 32,
    context: Context.SEI,
    contracts: {
      ...CONTRACTS.MAINNET.sei,
      seiTokenTranslator: '',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  wormchain: {
    context: Context.COSMOS,
    key: 'wormchain',
    id: 3104,
    contracts: {
      core: 'wormhole1ufs3tlq4umljk0qfe8k5ya0x6hpavn897u2cnf9k0en9jr7qarqqaqfk2j',
      token_bridge:
        'wormhole1466nf3zuxpya8q9emxukd7vftaf6h4psr0a07srl5zw74zh84yjq4lyjmh',
      ibcShimContract:
        'wormhole14ejqjyq8um4p3xfqj74yld5waqljf88fz25yxnma0cngspxe3les00fpjx',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  osmosis: {
    key: 'osmosis',
    id: 20,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
};

const env: Environment = 'MAINNET';
/**
 * default mainnet chain config
 */
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
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    base: 'https://mainnet.base.org',
    sei: '', // TODO: fill in
    wormchain: '',
    osmosis: 'https://osmosis-rpc.polkachu.com',
  },
  rest: {
    sei: '',
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
