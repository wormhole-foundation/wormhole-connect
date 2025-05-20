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
    icon: 'Terra2',
    symbol: 'OSMO',
  },
};
