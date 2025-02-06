import { Context } from 'sdklegacy';
import { NonSDKChainsConfig } from '../types';

export const MAINNET_NON_SDK_CHAINS: NonSDKChainsConfig = {
  Hyperliquid: {
    key: 'Arbitrum',
    id: 23,
    context: Context.ETH,
    finalityThreshold: 0,
    disabledAsSource: true,
    displayName: 'Hyperliquid',
    sdkName: 'Arbitrum',
    explorerUrl: 'https://app.hyperliquid.xyz/explorer',
    explorerName: 'Hyperliquid Explorer',
    gasToken: 'ETHarbitrum',
    chainId: 42161,
    icon: 'Hyperliquid',
    maxBlockSearch: 2000,
    symbol: 'HYPE',
    wrappedGasToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
};
