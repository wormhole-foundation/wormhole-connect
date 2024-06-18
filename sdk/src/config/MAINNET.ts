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
  klaytn: 13,
  celo: 14,
  moonbeam: 16,
  injective: 19,
  sui: 21,
  aptos: 22,
  arbitrum: 23,
  optimism: 24,
  base: 30,
  sei: 32,
  scroll: 34,
  mantle: 35,
  blast: 36,
  xlayer: 37,
  wormchain: 3104,
  osmosis: 20,
  cosmoshub: 4000,
  evmos: 4001,
  kujira: 4002,
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
      portico: '0x48b6101128C0ed1E208b7C910e60542A2ee6f476',
      uniswapQuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
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
      tbtcGateway: '87MEvHZCXE3ML5rrmh5uX1FbShHmRXXS32xJDGbQ7h5t',
      cctpContracts: {
        cctpTokenMessenger: 'CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3',
        cctpMessageTransmitter: 'CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd',
      },
    },
    finalityThreshold: 32,
    nativeTokenDecimals: 9,
    cctpDomain: 5,
  },
  polygon: {
    key: 'polygon',
    id: 5,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.polygon,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
      tbtcGateway: '0x09959798B95d00a3183d20FaC298E4594E599eab',
      cctpContracts: {
        cctpMessageTransmitter: '0xF3be9355363857F3e001be68856A2f96b4C39Ba9',
        cctpTokenMessenger: '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE',
        wormholeCCTP: '0x0FF28217dCc90372345954563486528aa865cDd6',
        wormholeCircleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
      },
      portico: '0x227bABe533fa9a1085f5261210E0B7137E44437B',
      uniswapQuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    },
    finalityThreshold: 42,
    nativeTokenDecimals: 18,
    cctpDomain: 7,
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.bsc,
      relayer: '0xcafd2f0a35a4459fa40c0517e17e6fa2939441ca',
      portico: '0x05498574BD0Fa99eeCB01e1241661E7eE58F8a85',
      uniswapQuoterV2: '0x78D78E420Da98ad378D7799bE8f4AF69033EB077',
    },
    finalityThreshold: 3,
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
      portico: '0xE565E118e75304dD3cF83dff409c90034b7EA18a',
      uniswapQuoterV2: '0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F',
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
      tbtcGateway: '0x1293a54e160D1cd7075487898d65266081A15458',
      portico: '0x48fa7528bFD6164DdF09dF0Ed22451cF59c84130',
      uniswapQuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
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
      tbtcGateway: '0x1293a54e160D1cd7075487898d65266081A15458',
      portico: '0x9ae506cDDd27DEe1275fd1fe6627E5dc65257061',
      uniswapQuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
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
      relayer: '0xaE8dc4a7438801Ec4edC0B035EcCCcF3807F4CC1',
      cctpContracts: {
        cctpTokenMessenger: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
        cctpMessageTransmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4',
        wormholeCircleRelayer: '0x4cb69fae7e7af841e44e1a1c30af640739378bb2',
        wormholeCCTP: '0x03faBB06Fa052557143dC28eFCFc63FC12843f1D',
      },
      tbtcGateway: '0x09959798B95d00a3183d20FaC298E4594E599eab',
      portico: '0x610d4DFAC3EC32e0be98D18DDb280DACD76A1889',
      uniswapQuoterV2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    cctpDomain: 6,
  },
  klaytn: {
    key: 'klaytn',
    id: 13,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.klaytn,
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
  scroll: {
    key: 'scroll',
    id: 34,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.scroll,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  mantle: {
    key: 'mantle',
    id: 35,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.mantle,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  blast: {
    key: 'blast',
    id: 36,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.blast,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
  },
  xlayer: {
    key: 'xlayer',
    id: 37,
    context: Context.ETH,
    contracts: {
      ...CONTRACTS.MAINNET.xlayer,
    },
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
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
  cosmoshub: {
    key: 'cosmoshub',
    id: 4000,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  evmos: {
    key: 'evmos',
    id: 4001,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
    disabledAsDestination: true,
  },
  kujira: {
    key: 'kujira',
    id: 4002,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 6,
  },
  injective: {
    key: 'injective',
    id: 19,
    context: Context.COSMOS,
    contracts: {},
    finalityThreshold: 0,
    nativeTokenDecimals: 18,
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
    solana: 'https://solana-mainnet.rpc.extrnode.com',
    polygon: 'https://rpc.ankr.com/polygon',
    bsc: 'https://bscrpc.com',
    avalanche: 'https://rpc.ankr.com/avalanche',
    fantom: 'https://rpc.ankr.com/fantom',
    celo: 'https://rpc.ankr.com/celo',
    moonbeam: 'https://rpc.ankr.com/moonbeam',
    sui: 'https://rpc.mainnet.sui.io',
    aptos: 'https://fullnode.mainnet.aptoslabs.com/v1',
    arbitrum: 'https://rpc.ankr.com/arbitrum',
    optimism: 'https://rpc.ankr.com/optimism',
    base: 'https://base.publicnode.com',
    sei: '', // TODO: fill in
    wormchain: 'https://wormchain-rpc.quickapi.com',
    osmosis: 'https://osmosis-rpc.polkachu.com',
    cosmoshub: 'https://cosmos-rpc.polkachu.com',
    evmos: 'https://evmos-rpc.polkachu.com',
    kujira: 'https://kujira-rpc.polkachu.com',
    injective: 'https://injective-rpc.publicnode.com/', // TODO: use the library to get the correct rpc https://docs.ts.injective.network/querying/querying-api/querying-indexer-explorer#fetch-transaction-using-transaction-hash
    klaytn: 'https://rpc.ankr.com/klaytn',
    scroll: 'https://rpc.ankr.com/scroll',
    blast: 'https://rpc.ankr.com/blast',
    xlayer: 'https://rpc.xlayer.tech',
    mantle: 'https://rpc.mantle.xyz',
  },
  rest: {
    sei: '',
    evmos: 'https://evmos-api.polkachu.com',
    injective: 'https://injective-api.polkachu.com',
  },
  graphql: {
    aptos: 'https://indexer.mainnet.aptoslabs.com/v1/graphql',
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
