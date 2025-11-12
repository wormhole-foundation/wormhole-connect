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

// Mainnet-only allowlist - only tokens in this list can be bridged on mainnet
// Testnet does not use an allowlist, only the deny list above
export const TOKEN_ALLOW_LIST: Partial<Record<Network, TokenId[]>> = {
  Mainnet: [
    // Monad tokens
    Wormhole.tokenId('Monad', 'native'), // MON
    Wormhole.tokenId('Monad', '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A'), // WMON
    Wormhole.tokenId('Monad', '0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242'), // WETH (NTT Token on Monad)
    // Ethereum tokens
    Wormhole.tokenId('Ethereum', 'native'), // ETH
    Wormhole.tokenId('Ethereum', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'), // WETH
    Wormhole.tokenId('Ethereum', '0x6917037F8944201b2648198a89906Edf863B9517'), // WMON (NTT Token on Ethereum)
  ],
};

export const CONTRACTS: Partial<Record<Network, MultiTokenNtt.Contracts[]>> = {
  Mainnet: [
    {
      chain: 'Ethereum',
      manager: '0x556790e948b9920A8868bCAFcC87D25e82e8a075',
      gmpManager: '0xc6793a32761a11e96c97A3D18fC6545ea931F0E9',
    },
    {
      chain: 'Monad',
      manager: '0x36878C6FCa7e0E8a88F90dc410CfBBcA5B695C95',
      gmpManager: '0x92957b3D0CaB3eA7110fEd1ccc4eF564981a59Fc',
    },
  ],
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
