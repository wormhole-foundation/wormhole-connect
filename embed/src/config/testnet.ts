import { CONFIG } from '@sdk';
import { NetworksConfig, TokenConfig } from './types';

import EthIcon from '../icons/tokens/eth.svg';
import BscIcon from '../icons/tokens/bsc.svg';
import FujiIcon from '../icons/tokens/avax.svg';
import FantomIcon from '../icons/tokens/fantom.svg';
import MaticIcon from '../icons/tokens/polygon.svg';
import USDCIcon from '../icons/tokens/usdc.svg';
import CeloIcon from '../icons/tokens/celo.svg';

const { chains } = CONFIG.TESTNET;

export const TESTNET_NETWORKS: NetworksConfig = {
  goerli: {
    ...chains.goerli!,
    icon: EthIcon,
  },
  bsc: {
    ...chains.bsc!,
    icon: BscIcon,
  },
  polygon: {
    ...chains.polygon!,
    icon: MaticIcon,
  },
  fuji: {
    ...chains.fuji!,
    icon: FujiIcon,
  },
  fantom: {
    ...chains.fantom!,
    icon: FantomIcon,
  },
  celo: {
    ...chains.celo!,
    icon: CeloIcon,
  },
};

export const TESTNET_TOKENS: { [key: string]: TokenConfig } = {
  ETH: {
    symbol: 'ETH',
    icon: EthIcon,
    address:
      '0x000000000000000000000000B4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: 18,
  },
  BNB: {
    symbol: 'BNB',
    icon: BscIcon,
    address:
      '0x000000000000000000000000ae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    coinGeckoId: 'bnb',
    color: '#F3BA30',
    decimals: 18,
  },
  USDC: {
    symbol: 'USDC',
    icon: USDCIcon,
    address:
      '0x0000000000000000000000005425890298aed601595a70AB815c96711a31Bc65',
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: 6,
  },
  AVAX: {
    symbol: 'AVAX',
    icon: FujiIcon,
    address:
      '0x000000000000000000000000d00ae08403B9bbb9124bB305C09058E32C39A48c',
    coinGeckoId: 'avalanche',
    color: '#E84141',
    decimals: 18,
  },
  FTM: {
    symbol: 'FTM',
    icon: FantomIcon,
    address:
      '0x000000000000000000000000f1277d1Ed8AD466beddF92ef448A132661956621',
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: 18,
  },
  MATIC: {
    symbol: 'MATIC',
    icon: MaticIcon,
    address:
      '0x0000000000000000000000009c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    coinGeckoId: 'polygon',
    color: '#8247E5',
    decimals: 18,
  },
  CELO: {
    symbol: 'CELO',
    icon: CeloIcon,
    address:
      '0x000000000000000000000000F194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    coinGeckoId: 'celo',
    color: '#35D07E',
    decimals: 18,
  },
};
