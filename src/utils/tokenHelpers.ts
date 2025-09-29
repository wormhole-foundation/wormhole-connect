import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import config from 'config';
import memoize from 'fast-memoize';

/**
 * Returns all token IDs for a given chain.
 * Used by routes that support swapping between any tokens on a chain.
 */
export const getAllTokenIdsForChain = memoize(
  (chain: Chain): TokenId[] => {
    return config.tokens.getAllForChain(chain).map((token) => token.tokenId);
  },
  {
    // Invalidate when token cache updates by including lastUpdate in the key
    serializer: (args: unknown[]) =>
      `${String(args[0])}|${config.tokens.lastUpdate.getTime()}`,
  },
);
