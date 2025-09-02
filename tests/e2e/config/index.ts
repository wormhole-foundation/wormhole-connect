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

const mayanMCTP = `{
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
    MayanRouteMCTP,
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

const CCTPV2Standard = `{
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
    cctpV2StandardExecutorRoute({ referrerFeeDbps: 0n, }),
  ],
}`;

const NTTRoutes = `{
  network: 'mainnet',
  coingecko: { customUrl: 'https://coingecko.labsapis.com' },
  ui: {
    experimental: { enableUIRefreshV3: true },
    showInProgressWidget: true,
    testOptions: { enableHeadlessSigner: false },
  },
  routes: [
    ...nttRoutes({
      tokens: {
        W: [
          {
            chain: "Solana",
            manager: "NTtAaoDJhkeHeaVUHnyhwbPNAN6WgBpHkHBTc6d7vLK",
            token: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
            transceiver: [
              {
                address: "NTtAaoDJhkeHeaVUHnyhwbPNAN6WgBpHkHBTc6d7vLK",
                type: "wormhole",
              },
            ],
            quoter: "Nqd6XqA8LbsCuG8MLWWuP865NV6jR1MbXeKxD4HLKDJ",
          },
          {
            chain: "Ethereum",
            manager: "0xc072B1AEf336eDde59A049699Ef4e8Fa9D594A48",
            token: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
            transceiver: [
              {
                address: "0xDb55492d7190D1baE8ACbE03911C4E3E7426870c",
                type: "wormhole",
              },
            ],
          },
          {
            chain: "Arbitrum",
            manager: "0x5333d0AcA64a450Add6FeF76D6D1375F726CB484",
            token: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
            transceiver: [
              {
                address: "0xD1a8AB69e00266e8B791a15BC47514153A5045a6",
                type: "wormhole",
              },
            ],
          },
          {
            chain: "Optimism",
            manager: "0x1a4F1a790f23Ffb9772966cB6F36dCd658033e13",
            token: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
            transceiver: [
              {
                address: "0x9bD8b7b527CA4e6738cBDaBdF51C22466756073d",
                type: "wormhole",
              },
            ],
          },
          {
            chain: "Base",
            manager: "0x5333d0AcA64a450Add6FeF76D6D1375F726CB484",
            token: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
            transceiver: [
              {
                address: "0xD1a8AB69e00266e8B791a15BC47514153A5045a6",
                type: "wormhole",
              },
            ],
          },
        ],
      },
    }),
  ],
  tokensConfig: {
    Wsolana: {
      symbol: "W",
      tokenId: {
        chain: "Solana",
        address: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",
      },
      icon: "https://assets.coingecko.com/coins/images/35087/standard/womrhole_logo_full_color_rgb_2000px_72ppi_fb766ac85a.png?1708688954",
      decimals: 6,
    },
    Wethereum: {
      symbol: "W",
      tokenId: {
        chain: "Ethereum",
        address: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
      },
      icon: "https://assets.coingecko.com/coins/images/35087/standard/womrhole_logo_full_color_rgb_2000px_72ppi_fb766ac85a.png?1708688954",
      decimals: 18,
    },
    Warbitrum: {
      symbol: "W",
      tokenId: {
        chain: "Arbitrum",
        address: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
      },
      icon: "https://assets.coingecko.com/coins/images/35087/standard/womrhole_logo_full_color_rgb_2000px_72ppi_fb766ac85a.png?1708688954",
      decimals: 18,
    },
    Woptimism: {
      symbol: "W",
      tokenId: {
        chain: "Optimism",
        address: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
      },
      icon: "https://assets.coingecko.com/coins/images/35087/standard/womrhole_logo_full_color_rgb_2000px_72ppi_fb766ac85a.png?1708688954",
      decimals: 18,
    },
    Wbase: {
      symbol: "W",
      tokenId: {
        chain: "Base",
        address: "0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91",
      },
      icon: "https://assets.coingecko.com/coins/images/35087/standard/womrhole_logo_full_color_rgb_2000px_72ppi_fb766ac85a.png?1708688954",
      decimals: 18,
    },
  },
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
    name: 'MayanSwapMCTP',
    config: mayanMCTP,
    enabled: true,
    sourceAsset: {
      chain: 'Arbitrum',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Arbitrum'),
    },
    destinationAsset: {
      chain: 'Base',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Base'),
    },
    amount: '10',
    waitForCompletion: false,
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
  {
    name: 'CCTPV2StandardExecutorRoute',
    config: CCTPV2Standard,
    enabled: true,
    sourceAsset: {
      chain: 'Base',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Base'),
    },
    destinationAsset: {
      chain: 'Arbitrum',
      symbol: 'USDC',
      address: circle.usdcContract.get('Mainnet', 'Arbitrum'),
    },
    amount: '10',
    waitForCompletion: false,
  },
  {
    name: 'NttExecutorRoute',
    config: NTTRoutes,
    enabled: true,
    sourceAsset: {
      chain: 'Ethereum',
      symbol: 'W',
      address: '0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91',
    },
    destinationAsset: {
      chain: 'Solana',
      symbol: 'W',
      address: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',
    },
    amount: '10',
    waitForCompletion: false,
  },
];
