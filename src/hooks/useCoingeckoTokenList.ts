import { useEffect, useState } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { fetchCoingeckoTokenListForChain } from 'utils/coingecko';

/**
 * Hook to fetch and cache CoinGecko token list for a specific chain.
 * Returns null while loading or if the chain is not supported.
 * Returns a Set of token addresses (lowercase) once loaded.
 */
export const useCoingeckoTokenList = (
  chain: Chain | undefined,
): Set<string> | null => {
  const [tokenList, setTokenList] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!chain) {
      setTokenList(null);
      return;
    }

    let cancelled = false;

    const fetchTokens = async () => {
      try {
        const tokens = await fetchCoingeckoTokenListForChain(chain);

        if (!cancelled) {
          setTokenList(tokens);
        }
      } catch (error) {
        console.error('Error in useCoingeckoTokenList:', error);
        if (!cancelled) {
          // Return empty set on error to allow fallback filter
          setTokenList(new Set());
        }
      }
    };

    fetchTokens();

    return () => {
      cancelled = true;
    };
  }, [chain]);

  return tokenList;
};
