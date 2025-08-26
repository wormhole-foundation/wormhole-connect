import type { Chain } from '@wormhole-foundation/sdk';
import type { Token } from 'config/tokens';
import { isSameToken } from 'config/tokens';
import config from 'config';

/**
 * Adds the source token to destination tokens if it exists on the destination chain
 * and isn't already in the list (excluding same-chain swaps).
 */
export const addSourceTokenToDestinations = (
  sourceToken: Token | undefined,
  sourceChain: Chain | undefined,
  destChain: Chain | undefined,
  supportedTokens: Token[],
): Token[] => {
  if (sourceToken && destChain && sourceChain !== destChain) {
    const sourceOnDest = config.tokens.get(
      destChain,
      sourceToken.addressString,
    );
    if (sourceOnDest) {
      const alreadyInList = supportedTokens.some((t) =>
        isSameToken(t, sourceOnDest),
      );
      if (!alreadyInList) {
        return [...supportedTokens, sourceOnDest];
      }
    }
  }
  return supportedTokens;
};
