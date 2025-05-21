import { circle } from '@wormhole-foundation/sdk';
import { TestConfig } from './types';

const COINGECKO_API_KEY = process.env.REACT_APP_TEST_CG_AK || '';

const mayanSWIFT = `{
  network: 'mainnet',
  coinGeckoApiKey: '${COINGECKO_API_KEY}',
  ui: {
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
  coinGeckoApiKey: '${COINGECKO_API_KEY}',
  ui: {
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
    amount: '1',
    waitForCompletion: true,
  },
  {
    name: 'CCTPExecutorRoute',
    config: CCTPExecutor,
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
