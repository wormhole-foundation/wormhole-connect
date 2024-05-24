import { describe, expect, test } from 'vitest';

import { MAINNET_CHAINS } from 'config/mainnet/chains';
import { MAINNET_TOKENS } from 'config/mainnet/tokens';
import { TESTNET_CHAINS } from 'config/testnet/chains';
import { TESTNET_TOKENS } from 'config/testnet/tokens';

export const envTests = [
  {
    title: 'mainnet configs',
    CHAINS: MAINNET_CHAINS,
    TOKENS: MAINNET_TOKENS,
  },
  {
    title: 'testnet configs',
    CHAINS: TESTNET_CHAINS,
    TOKENS: TESTNET_TOKENS,
  },
];

envTests.forEach((env) => {
  const { title, CHAINS, TOKENS } = env;
  describe(title, () => {
    test('chain gas tokens', () => {
      Object.entries(CHAINS)
        .filter(([id]) => id !== 'wormchain')
        .forEach(([_, { gasToken }]) => {
          const tokenConfig = TOKENS[gasToken];
          expect(tokenConfig).toBeTruthy();
        });
    });

    test('native tokens have valid wrapped token', () => {
      Object.values(TOKENS).forEach((token) => {
        if (!token.tokenId) {
          expect(token.wrappedAsset).toBeTruthy();
          const wrappedToken = TOKENS[token.wrappedAsset!];
          expect(wrappedToken).toBeTruthy();
        }
      });
    });

    test('tokens with tokenIds match nativeChain', () => {
      Object.values(TOKENS).forEach((token) => {
        if (token.tokenId) {
          expect(token.tokenId.chain).toBe(token.nativeChain);
        }
      });
    });
  });
});
