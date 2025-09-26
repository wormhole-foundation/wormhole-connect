import type { Chain, TokenId } from '@wormhole-foundation/sdk';
import { circle } from '@wormhole-foundation/sdk-base';
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

const normalizeAddress = (value: string): string => {
  return value.startsWith('0x') ? value.toLowerCase() : value;
};

export const isCanonicalUSDCToken = (
  chain: Chain,
  tokenAddress: string,
): boolean => {
  if (!circle.usdcContract.has(config.network, chain)) {
    return false;
  }

  const canonicalAddress = circle.usdcContract(config.network, chain);
  if (!canonicalAddress) {
    return false;
  }

  return normalizeAddress(tokenAddress) === normalizeAddress(canonicalAddress);
};
