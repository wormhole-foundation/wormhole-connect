import { NttGroups } from 'config/types';

export const TESTNET_NTT_GROUPS: NttGroups = {
  USDC_NTT: {
    nttManagers: [
      {
        chainName: 'Avalanche',
        address: '0x22D00F8aCcC2da440c937104BA49AfD8261a660F',
        tokenKey: 'USDCavax',
        transceivers: [
          {
            address: '0xeA8D34fa9147863e486d2d07AB92b8218CF58C0E',
            type: 'wormhole',
          },
        ],
      },
      {
        chainName: 'Celo',
        address: '0xdc86639219fD880A30C71B58E1cfA2707B645516',
        tokenKey: 'USDCalfajores',
        transceivers: [
          {
            address: '0x76516c0b966B4D4cFEFB107755562b16427dAE52',
            type: 'wormhole',
          },
        ],
      },
    ],
  },
};
