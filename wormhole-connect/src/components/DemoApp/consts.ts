import { NttRoute } from '@wormhole-foundation/sdk-route-ntt';

export const NTT_TEST_CONFIG_TESTNET: NttRoute.Config = {
  tokens: {
    USDC_NTT: [
      {
        chain: 'Avalanche',
        manager: '0x22D00F8aCcC2da440c937104BA49AfD8261a660F',
        token: '0x5425890298aed601595a70AB815c96711a31Bc65',
        transceiver: [
          {
            address: '0xeA8D34fa9147863e486d2d07AB92b8218CF58C0E',
            type: 'wormhole',
          },
        ],
      },
      {
        chain: 'Celo',
        manager: '0xdc86639219fD880A30C71B58E1cfA2707B645516',
        token: '0x72CAaa7e9889E0a63e016748179b43911A3ec9e5',
        transceiver: [
          {
            address: '0x76516c0b966B4D4cFEFB107755562b16427dAE52',
            type: 'wormhole',
          },
        ],
      },
    ],
  },
};

export const NTT_TEST_CONFIG_MAINNET: NttRoute.Config = {
  tokens: {
    FANTOM_USDC: [
      {
        chain: 'Ethereum',
        manager: '0xeBdCe9a913d9400EE75ef31Ce8bd34462D01a1c1',
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        transceiver: [
          {
            address: '0x55f7820357FA17A1ECb48E959D5E637bFF956d6F',
            type: 'wormhole',
          },
        ],
      },
      {
        chain: 'Fantom',
        manager: '0x68dB2f05Aa2d77DEf981fd2be32661340c9222FB',
        token: '0x2F733095B80A04b38b0D10cC884524a3d09b836a',
        transceiver: [
          {
            address: '0x8b47f02e7e20174c76af910adc0ad8a4b0342f4c',
            type: 'wormhole',
          },
        ],
      },
    ],
  },
};
