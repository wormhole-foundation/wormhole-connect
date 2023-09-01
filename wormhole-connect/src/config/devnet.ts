import { CONFIG } from '@wormhole-foundation/wormhole-connect-sdk';
import { NetworksConfig, TokenConfig, Icon, GasEstimates } from './types';

const { chains } = CONFIG.DEVNET;

// export enum Icon {
//   'AVAX' = 1,
//   'BNB',
//   'BSC',
//   'CELO',
//   'ETH',
//   'FANTOM',
//   'POLYGON',
//   'SOLANA',
//   'USDC',
//   'GLMR',
//   'DAI',
//   'USDT',
//   'BUSD',
//   'WBTC',
//   'SUI',
//   'APT',
//   'SEI',
//   'BASE',
//   'OSMO',
//   'BONK',
//   'TBTC',
//   'WSTETH',
// }

export const DEVNET_NETWORKS: NetworksConfig = {
  ethereum: {
    ...chains.ethereum!,
    displayName: 'EVM',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'ETH',
    chainId: 1,
    icon: Icon.ETH,
    automaticRelayer: false,
    maxBlockSearch: 0,
  },
  osmosis: {
    ...chains.osmosis!,
    displayName: 'Osmosis',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'OSMO',
    chainId: 'osmosis-1002',
    icon: Icon.OSMO,
    automaticRelayer: false,
    maxBlockSearch: 0,
  },
  wormchain: {
    ...chains.wormchain!,
    displayName: 'Wormchain',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'WORM',
    chainId: 'wormchain-1',
    icon: Icon.OSMO,
    automaticRelayer: false,
    maxBlockSearch: 0,
  },
  terra2: {
    ...chains.terra2!,
    displayName: 'Terra',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'LUNA',
    chainId: 'localterra',
    icon: Icon.OSMO,
    automaticRelayer: false,
    maxBlockSearch: 0,
  },
};

export const DEVNET_TOKENS: { [key: string]: TokenConfig } = {
  ETH: {
    key: 'ETH',
    symbol: 'ETH',
    nativeNetwork: 'ethereum',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETH',
  },
  WETH: {
    key: 'WETH',
    symbol: 'WETH',
    nativeNetwork: 'ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'ethereum',
      address: '0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  TKN: {
    key: 'TKN',
    symbol: 'TKN',
    nativeNetwork: 'ethereum',
    icon: Icon.ETH,
    tokenId: {
      chain: 'ethereum',
      address: '0x2D8BE6BF0baA74e0A907016679CaE9190e80dD0A',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  OSMO: {
    key: 'OSMO',
    symbol: 'OSMO',
    nativeNetwork: 'osmosis',
    tokenId: {
      chain: 'osmosis',
      address: 'uosmo',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'osmo',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
  WORM: {
    key: 'WORM',
    symbol: 'WORM',
    nativeNetwork: 'wormchain',
    tokenId: {
      chain: 'wormchain',
      address: 'uworm',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'worm',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
  LUNA: {
    key: 'LUNA',
    symbol: 'LUNA',
    nativeNetwork: 'terra2',
    tokenId: {
      chain: 'terra2',
      address: 'uluna',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'uluna',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
};

export const DEVNET_GAS_ESTIMATES: GasEstimates = {
  ethereum: {
    sendNative: 100000,
    sendToken: 150000,
    sendNativeWithRelay: 200000,
    sendTokenWithRelay: 300000,
    claim: 200000,
  },
  wormchain: {
    sendNative: 0,
    sendToken: 0,
    claim: 0,
  },
  osmosis: {
    sendNative: 750000,
    sendToken: 750000,
    claim: 700000,
  },
  terra2: {
    sendNative: 750000,
    sendToken: 750000,
    claim: 700000,
  },
};
