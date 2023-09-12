import { CONFIG } from '@wormhole-foundation/wormhole-connect-sdk';
import { ChainsConfig, Icon } from '../types';

const { chains } = CONFIG.DEVNET;

export const DEVNET_CHAINS: ChainsConfig = {
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
