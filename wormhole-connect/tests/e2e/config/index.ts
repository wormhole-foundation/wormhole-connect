import { CONTRACTS } from './constants';

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

const CCTPAutomatic = `{
  network: 'mainnet',
  coinGeckoApiKey: '${COINGECKO_API_KEY}',
  ui: {
    showInProgressWidget: true,
    testOptions: {
      enableHeadlessSigner: true,
    },
  },
  routes: [
    AutomaticCCTPRoute,
  ],
}`;

export const testConfigs = [
  {
    name: 'MayanSwapSWIFT',
    config: mayanSWIFT,
    sourceWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
      privateKey: process.env.REACT_APP_TEST_EVM_PK || '',
    },
    sourceAsset: {
      chain: 'arbitrum',
      symbol: 'USDC',
      address: CONTRACTS.Arbitrum.USDC,
    },
    destinationWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
    },
    destinationAsset: {
      chain: 'base',
      symbol: 'USDC',
      address: CONTRACTS.Base.USDC,
    },
    amount: '1',
    waitForCompletion: true,
  },
  {
    name: 'AutomaticCCTP',
    config: CCTPAutomatic,
    sourceWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
      privateKey: process.env.REACT_APP_TEST_EVM_PK || '',
    },
    sourceAsset: {
      chain: 'arbitrum',
      symbol: 'USDC',
      address: CONTRACTS.Arbitrum.USDC,
    },
    destinationWallet: {
      address: process.env.REACT_APP_TEST_EVM_ADDR || '',
    },
    destinationAsset: {
      chain: 'base',
      symbol: 'USDC',
      address: CONTRACTS.Base.USDC,
    },
    amount: '0.1',
    waitForCompletion: false,
  },
];
