import {
  ChainContext,
  isSameToken,
  Network,
  routes,
  TokenId,
  Wormhole,
} from '@wormhole-foundation/sdk';
import {
  MultiTokenNttExecutorRoute,
  MultiTokenNttManualRoute,
  MultiTokenNttRoute,
} from '@wormhole-foundation/sdk-route-ntt';

import '@wormhole-foundation/sdk-definitions-ntt';
import '@wormhole-foundation/sdk-evm-ntt';
import '@wormhole-foundation/sdk-solana-ntt';

// export MONAD_GmpManager=0xd5d871b5235f4eC89783b2D4c569399c2e347bB3
// export MONAD_MultiTokenNtt=0x8e07EBf7C4561333069F82E879313021b8aBad92
// export SEPOLIA_WormholeTransceiver=0x25e2A24c57f31E8bde679B8cf2018cB86b6313Ea
// export SEPOLIA_GmpManager=0xD2AbD2D35a86e298D4e929D4eEf88207f579eF2a
// export SEPOLIA_MultiTokenNtt=0xe4247DD690a5C903781c617d362e69ac3225566a

// TODO: this probably belongs in its own package, but for now we'll keep it here
export class MonadBridgeExecutorRoute<N extends Network>
  extends MultiTokenNttExecutorRoute<N>
  implements routes.StaticRouteMethods<typeof MonadBridgeExecutorRoute>
{
  static meta = {
    name: 'MonadBridgeExecutorRoute',
  };

  static tokenDenyList: TokenId[] = [
    // These tokens have Wormhole versions deployed, so allow users to bridge those instead of these
    Wormhole.tokenId('Monad', '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'), // USDC
    Wormhole.tokenId('Monad', '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D'), // USDT
    Wormhole.tokenId('Monad', '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'), // WBTC
    Wormhole.tokenId('Monad', '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37'), // WETH
  ];

  static override config: MultiTokenNttExecutorRoute.Config = {
    ntt: {
      contracts: [
        {
          chain: 'Sepolia',
          manager: '0x6c5aAE4622B835058A41879bA5e128019B9047d6',
          gmpManager: '0xDaeE3A6B4196E3e46015b364F1DAe54CEAE74A91',
          transceiver: {
            wormhole: '0x3D11D1c1a8763c8508e0F3d4F6ec08D0D6cC293e',
          },
        },
        {
          chain: 'Monad',
          manager: '0x600D3C45Cd002E7359D12597Bb8058a0C32A20Df',
          gmpManager: '0x641a6608e2959c0D7Fe2a5F267DFDA519ED43d98',
          transceiver: {
            wormhole: '0xf72AbB2B4C53B722643355A9816Ddddcd7F215F4',
          },
        },
      ],
    },
  };

  static override async supportedDestinationTokens<N extends Network>(
    sourceToken: TokenId,
    fromChain: ChainContext<N>,
    toChain: ChainContext<N>,
  ): Promise<TokenId[]> {
    if (
      fromChain.network === 'Testnet' &&
      MonadBridgeExecutorRoute.tokenDenyList.some((t) =>
        isSameToken(t, sourceToken),
      )
    ) {
      return [];
    }

    return super.supportedDestinationTokens(sourceToken, fromChain, toChain);
  }
}

// TODO: this probably belongs in its own package, but for now we'll keep it here
export class MonadBridgeManualRoute<N extends Network>
  extends MultiTokenNttManualRoute<N>
  implements routes.StaticRouteMethods<typeof MonadBridgeManualRoute>
{
  static meta = {
    name: 'MonadBridgeManualRoute',
  };

  static tokenDenyList: TokenId[] = [
    // These tokens have Wormhole versions deployed, so allow users to bridge those instead of these
    Wormhole.tokenId('Monad', '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'), // USDC
    Wormhole.tokenId('Monad', '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D'), // USDT
    Wormhole.tokenId('Monad', '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d'), // WBTC
    Wormhole.tokenId('Monad', '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37'), // WETH
  ];

  static override config: MultiTokenNttRoute.Config = {
    contracts: [
      {
        chain: 'Sepolia',
        manager: '0x6c5aAE4622B835058A41879bA5e128019B9047d6',
        gmpManager: '0xDaeE3A6B4196E3e46015b364F1DAe54CEAE74A91',
        transceiver: {
          wormhole: '0x3D11D1c1a8763c8508e0F3d4F6ec08D0D6cC293e',
        },
      },
      {
        chain: 'Monad',
        manager: '0x600D3C45Cd002E7359D12597Bb8058a0C32A20Df',
        gmpManager: '0x641a6608e2959c0D7Fe2a5F267DFDA519ED43d98',
        transceiver: {
          wormhole: '0xf72AbB2B4C53B722643355A9816Ddddcd7F215F4',
        },
      },
    ],
  };

  static override async supportedDestinationTokens<N extends Network>(
    sourceToken: TokenId,
    fromChain: ChainContext<N>,
    toChain: ChainContext<N>,
  ): Promise<TokenId[]> {
    if (
      fromChain.network === 'Testnet' &&
      MonadBridgeManualRoute.tokenDenyList.some((t) =>
        isSameToken(t, sourceToken),
      )
    ) {
      return [];
    }

    return super.supportedDestinationTokens(sourceToken, fromChain, toChain);
  }
}
