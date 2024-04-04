import { NttGroups } from 'config/types';

export const MAINNET_NTT_GROUPS: NttGroups = {
  FANTOM_USDC: {
    nttManagers: [
      {
        chainName: 'ethereum',
        address: '0xeBdCe9a913d9400EE75ef31Ce8bd34462D01a1c1',
        tokenKey: 'USDCeth',
        transceivers: [
          {
            address: '0x55f7820357FA17A1ECb48E959D5E637bFF956d6F',
            type: 'wormhole',
          },
        ],
      },
      {
        chainName: 'fantom',
        address: '0x68dB2f05Aa2d77DEf981fd2be32661340c9222FB',
        tokenKey: 'USDCfantom',
        transceivers: [
          {
            address: '0x8b47f02e7e20174c76af910adc0ad8a4b0342f4c',
            type: 'wormhole',
          },
        ],
      },
    ],
  },
};
