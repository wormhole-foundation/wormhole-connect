import { NttRoute } from '@wormhole-foundation/sdk-route-ntt';

export const TESTNET_NTT_CONFIG: NttRoute.Config = {
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
