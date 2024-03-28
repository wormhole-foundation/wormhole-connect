import { NttGroups } from 'config/types';

export const TESTNET_NTT_GROUPS: NttGroups = {
  TEST_NTT: {
    nttManagers: [
      {
        chainName: 'sepolia',
        address: '0xB231aD95f2301bc82eA44c515001F0F746D637e0',
        tokenKey: 'TEST_NTTsepolia',
        transceivers: [
          {
            address: '0x1fDC902e30b188FD2BA976B421Cb179943F57896',
            type: 'wormhole',
          },
        ],
      },
      {
        chainName: 'arbitrum_sepolia',
        address: '0xEec94CD3083e067398256a79CcA7e740C5c8ef81',
        tokenKey: 'TEST_NTTarbitrum_sepolia',
        transceivers: [
          {
            address: '0x0E24D17D7467467b39Bf64A9DFf88776Bd6c74d7',
            type: 'wormhole',
          },
        ],
      },
      {
        chainName: 'base_sepolia',
        address: '0xB03b030b2f5B40819Df76467d67eD1C85Ff66fAD',
        tokenKey: 'TEST_NTTbase_sepolia',
        transceivers: [
          {
            address: '0x1e072169541f1171e427Aa44B5fd8924BEE71b0e',
            type: 'wormhole',
          },
        ],
      },
      {
        chainName: 'optimism_sepolia',
        address: '0x7f430D4e7939D994C0955A01FC75D9DE33F12D11',
        tokenKey: 'TEST_NTToptimism_sepolia',
        transceivers: [
          {
            address: '0x41265eb2863bf0238081F6AeefeF73549C82C3DD',
            type: 'wormhole',
          },
        ],
      },
      {
        chainName: 'solana',
        address: 'nTTh3bZ5Aer6xboWZe39RDEft4MeVxSQ8D1EYAVLZw9',
        tokenKey: 'TEST_NTTsolana',
        transceivers: [
          {
            address: 'nTTh3bZ5Aer6xboWZe39RDEft4MeVxSQ8D1EYAVLZw9',
            type: 'wormhole',
          },
        ],
        solanaQuoter: 'NqTdGLLL6b6bFo7YESNEezocgF8onH5cst5EdH791en',
      },
    ],
  },
  TEST_USDC: {
    nttManagers: [
      {
        chainName: 'sepolia',
        address: '0xFCD6994bC89FCB5891404Eb6268cFB3701F1C198',
        tokenKey: 'USDCsepolia',
        transceivers: [
          {
            address: '0xE18EF44f81fcF4ba3eD765F0B360B68f823Fac33',
            type: 'wormhole',
          },
        ],
      },
      {
        chainName: 'alfajores',
        address: '0x12594D5EBF88Deb5b02a6B7d265B421f6EE2CbA6',
        tokenKey: 'USDCalfajores',
        transceivers: [
          {
            address: '0x328f1fa5f84f62177d1e04976FdC49aB07578cf0',
            type: 'wormhole',
          },
        ],
      },
    ],
  },
};
