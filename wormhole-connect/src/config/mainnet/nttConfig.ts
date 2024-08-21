import { NttRoute } from '@wormhole-foundation/sdk-route-ntt';

export const MAINNET_NTT_CONFIG: NttRoute.Config = {
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
