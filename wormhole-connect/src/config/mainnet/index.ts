import { NetworkData } from 'config/types';
import { MAINNET_CHAINS } from './chains';
import {
  MAINNET_GRAPHQL_MAPPING,
  MAINNET_REST_MAPPING,
  MAINNET_RPC_MAPPING,
} from './rpcs';
import { MAINNET_TOKENS } from './tokens';
import { MAINNET_NTT_CONFIG } from './nttConfig';

export * from './chains';
export * from './rpcs';
export * from './tokens';

const MAINNET: NetworkData = {
  chains: MAINNET_CHAINS,
  tokens: MAINNET_TOKENS,
  rpcs: MAINNET_RPC_MAPPING,
  rest: MAINNET_REST_MAPPING,
  graphql: MAINNET_GRAPHQL_MAPPING,
  nttConfig: MAINNET_NTT_CONFIG,
  // From VAA https://wormholescan.io/#/tx/1/0000000000000000000000000000000000000000000000000000000000000004/18252082506122526004
  guardianSet: {
    index: 4,
    keys: [
      '0x5893b5a76c3f739645648885bdccc06cd70a3cd3',
      '0xff6cb952589bde862c25ef4392132fb9d4a42157',
      '0x114de8460193bdf3a2fcf81f86a09765f4762fd1',
      '0x107a0086b32d7a0977926a205131d8731d39cbeb',
      '0x8c82b2fd82faed2711d59af0f2499d16e726f6b2',
      '0x11b39756c042441be6d8650b69b54ebe715e2343',
      '0x54ce5b4d348fb74b958e8966e2ec3dbd4958a7cd',
      '0x15e7caf07c4e3dc8e7c469f92c8cd88fb8005a20',
      '0x74a3bf913953d695260d88bc1aa25a4eee363ef0',
      '0x000ac0076727b35fbea2dac28fee5ccb0fea768e',
      '0xaf45ced136b9d9e24903464ae889f5c8a723fc14',
      '0xf93124b7c738843cbb89e864c862c38cddcccf95',
      '0xd2cc37a4dc036a8d232b48f62cdd4731412f4890',
      '0xda798f6896a3331f64b48c12d1d57fd9cbe70811',
      '0x71aa1be1d36cafe3867910f99c09e347899c19c3',
      '0x8192b6e7387ccd768277c17dab1b7a5027c0b3cf',
      '0x178e21ad2e77ae06711549cfbb1f9c7a9d8096e8',
      '0x5e1487f35515d02a92753504a8d75471b9f49edb',
      '0x6fbebc898f403e4773e95feb15e80c9a99c8348d',
    ],
  },
};

export default MAINNET;
