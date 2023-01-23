import { Network as Environment, Contracts } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig, TokenConfig } from '../types';

import EthIcon from '../../icons/tokens/eth.svg';
import BscIcon from '../../icons/tokens/bsc.svg';
import FujiIcon from '../../icons/tokens/avax.svg';
import FantomIcon from '../../icons/tokens/fantom.svg';
import USDCIcon from '../../icons/tokens/usdc.svg';

// https://book.wormhole.com/reference/contracts.html
export const TESTNET_CHAINS = {
  goerli: 2,
  bsc: 4,
  fuji: 6,
  fantom: 10,
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
      core: '0x706abc4E45D419950511e474C7B9Ed348A4a716c',
      token_bridge: '0xbd17f38aaa5c26f4eb724a315bb222fa9091b3b0',
      nft_bridge: '0xD8E4C2DbDd2e2bd8F1336EA691dBFF6952B1a6eB',
    },
    icon: EthIcon,
    displayName: 'Goerli',
    explorerUrl: 'https://goerli.etherscan.io/',
    explorerName: 'Etherscan',
    gasToken: 'ETH',
  },
  bsc: {
    key: 'bsc',
    id: 4,
    context: Context.ETH,
    contracts: {
      core: '0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D',
      token_bridge: '0xbc587768a949eec05a9ee62fd0dcc4bae39e2b64',
      nft_bridge: '0xcD16E5613EF35599dc82B24Cb45B5A93D779f1EE',
    },
    icon: BscIcon,
    displayName: 'BSC',
    explorerUrl: 'https://testnet.bscscan.com/',
    explorerName: 'BscScan',
    gasToken: 'BNB',
  },
  fuji: {
    key: 'fuji',
    id: 6,
    context: Context.ETH,
    contracts: {
      core: '0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C',
      token_bridge: '0x834a314ae95e494cdc0b8841c0fd408f7d3cbe9c',
      nft_bridge: '0xD601BAf2EEE3C028344471684F6b27E789D9075D',
    },
    icon: FujiIcon,
    displayName: 'Fuji',
    explorerUrl: 'https://testnet.snowtrace.io/',
    explorerName: 'Snowtrace',
    gasToken: 'AVAX',
  },
  fantom: {
    key: 'fantom',
    id: 10,
    context: Context.ETH,
    contracts: {
      core: '0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7',
      token_bridge: '0x032c4a77e35674fe5b8a687e9bf27bd4c2a1b81f',
      nft_bridge: '0x63eD9318628D26BdCB15df58B53BB27231D1B227',
    },
    icon: FantomIcon,
    displayName: 'Fantom',
    explorerUrl: 'https://testnet.ftmscan.com/',
    explorerName: 'FtmScan',
    gasToken: 'FTM',
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
  },
  BNB: {
    symbol: 'BNB',
    icon: BscIcon,
    address:
      '0x000000000000000000000000ae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    coinGeckoId: 'bnb',
    color: '#F3BA30',
  },
  USDC: {
    symbol: 'USDC',
    icon: USDCIcon,
    address:
      '0x0000000000000000000000005425890298aed601595a70AB815c96711a31Bc65',
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
  },
  AVAX: {
    symbol: 'AVAX',
    icon: FujiIcon,
    address:
      '0x000000000000000000000000d00ae08403B9bbb9124bB305C09058E32C39A48c',
    coinGeckoId: 'avalanche',
    color: '#E84141',
  },
  FTM: {
    symbol: 'FTM',
    icon: FantomIcon,
    address:
      '0x000000000000000000000000f1277d1Ed8AD466beddF92ef448A132661956621',
    coinGeckoId: 'fantom',
    color: '#12B4EC',
  },
};

const env: Environment = 'TESTNET';
const TESTNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    goerli: 'https://goerli-light.eth.linkpool.io/',
    bsc: 'https://data-seed-prebsc-2-s3.binance.org:8545',
    fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
    fantom: 'https://rpc.testnet.fantom.network',
  },
  chains: TESTNET,
};

export default TESTNET_CONFIG;
