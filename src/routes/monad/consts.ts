import type { Network, TokenId } from '@wormhole-foundation/sdk-connect';
import { Wormhole } from '@wormhole-foundation/sdk-connect';
import type { MultiTokenNtt } from '@wormhole-foundation/sdk-definitions-ntt';

export const TOKEN_DENY_LIST: Partial<Record<Network, TokenId[]>> = {
  Mainnet: [],
  Testnet: [
    // These tokens have Wormhole versions deployed, so let users to bridge those instead
    Wormhole.tokenId('Monad', '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'), // USDC
    Wormhole.tokenId('Monad', '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D'), // USDT
    Wormhole.tokenId('Monad', '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'), // WBTC
    Wormhole.tokenId('Monad', '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37'), // WETH
  ],
};

export const CONTRACTS: Partial<Record<Network, MultiTokenNtt.Contracts[]>> = {
  Mainnet: [],
  Testnet: [
    {
      chain: 'Sepolia',
      manager: '0x6c5aAE4622B835058A41879bA5e128019B9047d6',
      gmpManager: '0xDaeE3A6B4196E3e46015b364F1DAe54CEAE74A91',
    },
    {
      chain: 'Monad',
      manager: '0x600D3C45Cd002E7359D12597Bb8058a0C32A20Df',
      gmpManager: '0x641a6608e2959c0D7Fe2a5F267DFDA519ED43d98',
    },
  ],
};

// // secondary testnet deployment (for testing upgrades)
// export const CONTRACTS: Partial<Record<Network, MultiTokenNtt.Contracts[]>> = {
//   Mainnet: [],
//   // primary testnet deployment
//   Testnet: [
//     {
//       chain: 'Sepolia',
//       manager: '0xe4247DD690a5C903781c617d362e69ac3225566a',
//       gmpManager: '0xD2AbD2D35a86e298D4e929D4eEf88207f579eF2a',
//     },
//     {
//       chain: 'Monad',
//       manager: '0x8e07EBf7C4561333069F82E879313021b8aBad92',
//       gmpManager: '0xd5d871b5235f4eC89783b2D4c569399c2e347bB3',
//     },
//   ],
// };
