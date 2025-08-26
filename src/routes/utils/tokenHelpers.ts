import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import config from 'config';

/**
 * Returns all token IDs for a given chain.
 * Used by routes that support swapping between any tokens on a chain.
 */
export const getAllTokenIdsForChain = (chain: Chain): TokenId[] => {
  return config.tokens.getAllForChain(chain).map((token) => token.tokenId);
};
