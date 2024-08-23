import { CONFIG } from 'sdklegacy';
import { ChainsConfig, Icon } from '../types';

const { chains } = CONFIG.DEVNET;

export const DEVNET_CHAINS: ChainsConfig = {
  Ethereum: {
    ...chains.Ethereum!,
    displayName: 'EVM',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'ETH',
    chainId: 1,
    icon: Icon.ETH,
    automaticRelayer: false,
    maxBlockSearch: 0,
  },
  Osmosis: {
    ...chains.Osmosis!,
    displayName: 'Osmosis',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'OSMO',
    chainId: 'osmosis-1002',
    icon: Icon.OSMO,
    automaticRelayer: false,
    maxBlockSearch: 0,
  },
  Wormchain: {
    ...chains.Wormchain!,
    displayName: 'Wormchain',
    explorerUrl: '',
    explorerName: '',
    gasToken: 'WORM',
    chainId: 'wormchain-1',
    icon: Icon.OSMO,
    automaticRelayer: false,
    maxBlockSearch: 0,
  },
  Terra2: {
    ...chains.Terra2!,
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
