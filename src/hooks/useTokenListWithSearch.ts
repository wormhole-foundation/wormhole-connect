import { useEffect, useMemo, useState } from 'react';
import { toNative } from '@wormhole-foundation/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import type { Token } from 'config/tokens';
import { isSameToken } from 'config/tokens';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';
import { filterTokensByBalance } from 'utils/tokenListUtils';
import type { Balances } from 'utils/wallet/types';

interface UseTokenListWithSearchParams {
  baseTokenList: Token[];
  searchQuery: string;
  chain: Chain | undefined;
  isSource: boolean;
  isSameChainSwap: boolean;
  sourceToken?: Token;
  balances: Balances;
  walletAddress: string;
  tokenPastingEnabled?: boolean;
}

interface UseTokenListWithSearchReturn {
  sortedTokens: Token[];
  tokenPrices: Map<string, number | undefined>;
}

/**
 * Combined hook that handles:
 * 1. Searching for tokens by address
 * 2. Merging searched tokens with base token list
 * 3. Filtering for same-chain swaps
 * 4. Fetching and managing token prices
 */
export const useTokenListWithSearch = ({
  baseTokenList,
  searchQuery,
  chain,
  isSource,
  isSameChainSwap,
  sourceToken,
  balances,
  walletAddress,
  tokenPastingEnabled = true,
}: UseTokenListWithSearchParams): UseTokenListWithSearchReturn => {
  const [searchedTokens, setSearchedTokens] = useState<Token[]>([]);
  const [tokenPrices, setTokenPrices] = useState<
    Map<string, number | undefined>
  >(new Map());
  const { getOrFetchToken, getTokenPrices, lastTokenPriceUpdate } = useTokens();

  // Handle token search by address
  useEffect(() => {
    if (!chain || !tokenPastingEnabled) {
      setSearchedTokens([]);
      return;
    }

    if (searchQuery) {
      try {
        const address = toNative(chain, searchQuery);

        if (address) {
          const existing = config.tokens.get(chain, searchQuery);

          const addTokenIfNotExists = (token: Token) => {
            setSearchedTokens((prev) => {
              const alreadyExists = prev.some((t) => isSameToken(t, token));
              return alreadyExists ? prev : [...prev, token];
            });
          };

          if (!existing) {
            getOrFetchToken({ chain, address }).then((fetchedToken) => {
              if (fetchedToken) {
                addTokenIfNotExists(fetchedToken);
              }
            });
          } else {
            addTokenIfNotExists(existing);
          }
        }
      } catch (_e) {
        // Failed to parse as address - expected behavior
      }
    } else {
      setSearchedTokens([]);
    }
  }, [searchQuery, chain, getOrFetchToken, tokenPastingEnabled]);

  // Merge and filter tokens
  const sortedTokens = useMemo(() => {
    const mergedTokens = [...baseTokenList];

    // Add searched tokens that aren't already in the list
    for (const searchedToken of searchedTokens) {
      if (!mergedTokens.some((t) => isSameToken(t, searchedToken))) {
        // For source list, filter searched tokens by balance when not actively searching
        if (isSource && !searchQuery) {
          const filteredSearchedTokens = filterTokensByBalance(
            [searchedToken],
            balances,
            walletAddress,
          );
          // Only add if it passes the balance filter
          if (filteredSearchedTokens.length > 0) {
            mergedTokens.push(searchedToken);
          }
        } else {
          // For destination tokens or when searching, add all searched tokens
          mergedTokens.push(searchedToken);
        }
      }
    }

    // For destination token list in same-chain swaps, filter out the source token
    if (!isSource && isSameChainSwap && sourceToken) {
      return mergedTokens.filter(
        (token) => token.addressString !== sourceToken.addressString,
      );
    }

    return mergedTokens;
  }, [
    baseTokenList,
    searchedTokens,
    isSource,
    isSameChainSwap,
    sourceToken,
    searchQuery,
    balances,
    walletAddress,
  ]);

  // Get token prices for all tokens
  const allTokens = useMemo(
    () => [...baseTokenList, ...searchedTokens],
    [baseTokenList, searchedTokens],
  );

  useEffect(() => {
    const prices = getTokenPrices(allTokens);
    setTokenPrices(prices);
  }, [allTokens, getTokenPrices, lastTokenPriceUpdate]);

  return {
    sortedTokens,
    tokenPrices,
  };
};
