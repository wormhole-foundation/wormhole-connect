import { circle } from '@wormhole-foundation/sdk';
import type { TestConfig } from './types';

const mayanSWIFT = `{
  network: 'mainnet',
  coingecko: { customUrl: 'https://coingecko.labsapis.com' },
  ui: {
    experimental: { enableUIRefreshV3: true },
    showInProgressWidget: true,
    testOptions: {
      enableHeadlessSigner: true,
    },
  },
  routes: [
    MayanRouteSWIFT,
  ],
}`;

const CCTPExecutor = `{
  network: 'mainnet',
  coingecko: { customUrl: 'https://coingecko.labsapis.com' },
  ui: {
    experimental: { enableUIRefreshV3: true },
    showInProgressWidget: true,
    testOptions: {
      enableHeadlessSigner: true,
    },
  },
  routes: [
    cctpExecutorRoute({ referrerFeeDbps: 0n, }),
  ],
}`;

export const testConfigs: Array<TestConfig> = [
  {
    name: 'MayanSwapSWIFT',
    config: mayanSWIFT,
    enabled: true,
    sourceWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
      privateKey: process.env.REACT_APP_TEST_EVM_PK || '',
    },
    sourceAsset: {
      chain: 'Arbitrum',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Arbitrum'),
    },
    destinationWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
    },
    destinationAsset: {
      chain: 'Base',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Base'),
    },
    amount: '3',
    waitForCompletion: true,
  },
  {
    name: 'CCTPExecutorRoute',
    config: CCTPExecutor,
    enabled: true,
    sourceWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
      privateKey: process.env.REACT_APP_TEST_EVM_PK || '',
    },
    sourceAsset: {
      chain: 'Base',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Base'),
    },
    destinationWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
    },
    destinationAsset: {
      chain: 'Arbitrum',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Arbitrum'),
    },
    amount: '1',
    waitForCompletion: false,
  },
];
