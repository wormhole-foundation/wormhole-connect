import { CONFIG } from 'sdklegacy';
import { ChainsConfig } from '../types';

const { chains } = CONFIG.DEVNET;

export const DEVNET_CHAINS: ChainsConfig = {
  Ethereum: {
    ...chains.Ethereum!,
    sdkName: 'Ethereum',
    displayName: 'EVM',
    explorerUrl: '',
    explorerName: '',
    wrappedGasToken: '0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E',
    chainId: 1,
    icon: 'Ethereum',
    symbol: 'ETH',
  },
  Osmosis: {
    ...chains.Osmosis!,
    displayName: 'Osmosis',
    sdkName: 'Osmosis',
    explorerUrl: '',
    explorerName: '',
    wrappedGasToken: '',
    chainId: 'osmosis-1002',
    icon: 'Osmosis',
    symbol: 'OSMO',
  },
  Wormchain: {
    ...chains.Wormchain!,
    sdkName: 'Wormchain',
    displayName: 'Wormchain',
    explorerUrl: '',
    explorerName: '',
    wrappedGasToken: '',
    chainId: 'wormchain-1',
    icon: 'Osmosis',
    symbol: 'OSMO',
  },
  Terra2: {
    ...chains.Terra2!,
    sdkName: 'Terra2',
    displayName: 'Terra',
    explorerUrl: '',
    explorerName: '',
    wrappedGasToken: '',
    chainId: 'localterra',
    icon: 'Terra2',
    symbol: 'OSMO',
  },
};
