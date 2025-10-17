import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useDeferredValue,
  startTransition,
} from 'react';
import { amount as sdkAmount, toNative } from '@wormhole-foundation/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import type { Token } from 'config/tokens';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';
import {
  getTokenDisplaySymbolByTokenAddress,
  isFrankensteinToken,
} from 'utils';
import {
  getWrappedNativeToken,
  shouldFilterSameChainToken,
} from 'utils/wrappedNativeTokens';
import type { Balances } from 'utils/wallet/types';
import { unionBy } from 'es-toolkit';

interface UseTokenListWithSearchParams {
  baseTokenList: Token[];
  searchQuery: string;
  chain: Chain | undefined;
  isSource: boolean;
  isSameChainSwap: boolean;
  sourceToken?: Token;
  balances?: Balances;
  tokenPastingEnabled?: boolean;
  isTokenPickerOpen?: boolean;
  selectedToken?: Token;
}

interface UseTokenListWithSearchReturn {
  sortedTokens: Token[];
  tokenPrices: Map<string, number | undefined>;
}

// Maximum number of tokens to fetch prices for initially
const MAX_INITIAL_PRICE_FETCHES = 10;

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
  tokenPastingEnabled = true,
  isTokenPickerOpen,
  selectedToken,
}: UseTokenListWithSearchParams): UseTokenListWithSearchReturn => {
  const [searchedTokens, setSearchedTokens] = useState<Token[]>([]);
  const { getOrFetchToken, getTokenPrices } = useTokens();
  const deferredSearch = useDeferredValue(searchQuery);
  const searchLower = deferredSearch ? deferredSearch.toLowerCase() : '';

  const addTokenIfNotExists = useCallback((token: Token) => {
    // Dedupe happens later via unionBy in the memoized list.
    setSearchedTokens((prev) => [...prev, token]);
  }, []);

  // Get wrapped native address for same-chain swaps (only for destination selection)
  const wrappedNativeAddr = useMemo(() => {
    if (!isSameChainSwap || !chain || isSource) {
      return undefined;
    }
    const wrapped = getWrappedNativeToken(config.network, chain);
    return wrapped?.toLowerCase();
  }, [isSameChainSwap, chain, isSource]);

  useEffect(() => {
    if (!chain || !tokenPastingEnabled || !deferredSearch) {
      setSearchedTokens([]);
      return;
    }

    // Avoid running address parsing/fetching for very short inputs
    if (deferredSearch.length < 10) {
      setSearchedTokens([]);
      return;
    }

    // First try exact address match for pasting
    try {
      const address = toNative(chain, deferredSearch);

      if (address) {
        const existing = config.tokens.get(chain, deferredSearch);

        if (!existing) {
          // Note: we intentionally do not await this promise; we opportunistically
          // add the token when it resolves to keep typing responsive.
          getOrFetchToken({ chain, address }).then((fetchedToken) => {
            // Guard against stale results if chain or query changed
            if (fetchedToken) {
              startTransition(() => addTokenIfNotExists(fetchedToken));
            }
          });
        } else {
          startTransition(() => addTokenIfNotExists(existing));
        }
      }
    } catch {
      // Failed to parse as full address - expected for partial searches
    }
  }, [
    deferredSearch,
    chain,
    getOrFetchToken,
    tokenPastingEnabled,
    addTokenIfNotExists,
  ]);

  const sortedTokens = useMemo(() => {
    // Merge base tokens with any fetched tokens only when searching
    let tokens = deferredSearch
      ? unionBy(baseTokenList, searchedTokens, (t) => t.key)
      : baseTokenList;

    if (deferredSearch) {
      tokens = tokens.filter((token) => {
        const overrideName =
          getTokenDisplaySymbolByTokenAddress(token)?.toLowerCase();
        const symbolMatch = token.symbol?.toLowerCase().includes(searchLower);
        const nameMatch = token.name?.toLowerCase().includes(searchLower);
        const overrideMatch = overrideName?.includes(searchLower);

        if (symbolMatch || nameMatch || overrideMatch) {
          return true;
        }

        if (token.addressString.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Check original token address if wrapped
        if (
          token.tokenBridgeOriginalTokenId &&
          token.tokenBridgeOriginalTokenId.address
            .toString()
            .toLowerCase()
            .includes(searchLower)
        ) {
          return true;
        }

        return false;
      });
    }

    // For destination token list in same-chain swaps, filter out invalid options
    if (sourceToken && isSameChainSwap && !isSource) {
      tokens = tokens.filter(
        (t) => !shouldFilterSameChainToken(sourceToken, wrappedNativeAddr, t),
      );
    }

    // Filter frankenstein tokens based on whether it's source or destination
    if (chain) {
      tokens = tokens.filter((token) => {
        if (!isFrankensteinToken(token, chain)) {
          return true;
        }

        // For destination tokens: always filter out frankenstein tokens
        if (!isSource) {
          return false;
        }

        // For source tokens: only show frankenstein tokens if they have a balance
        if (balances) {
          const balance = balances[token.key]?.balance;
          const hasBalance = balance && sdkAmount.units(balance) > 0n;
          return hasBalance;
        }

        // No balances available - don't show frankenstein tokens
        return false;
      });
    }

    return tokens;
  }, [
    baseTokenList,
    searchedTokens,
    deferredSearch,
    searchLower,
    sourceToken,
    isSameChainSwap,
    isSource,
    wrappedNativeAddr,
    chain,
    balances,
  ]);

  // Determine which tokens to fetch prices for based on context
  const tokensForPriceFetch = useMemo(() => {
    // If token picker is open or we're searching, fetch prices for all visible tokens
    if (isTokenPickerOpen || searchQuery) {
      return sortedTokens;
    }

    // Otherwise, only fetch prices for:
    // 1. The currently selected token (if any)
    // 2. First N tokens that would be visible
    const priorityTokens: Token[] = [];

    // Add selected token first
    if (selectedToken) {
      const selectedInList = sortedTokens.find(
        (t) => t.key === selectedToken.key,
      );
      if (selectedInList) {
        priorityTokens.push(selectedInList);
      }
    }

    // Add tokens with balances first (they're already sorted by balance)
    const tokensWithBalance = sortedTokens.filter(
      (token) => balances?.[token.key]?.balance?.amount !== '0',
    );

    // Then add tokens without balances
    const tokensWithoutBalance = sortedTokens.filter(
      (token) =>
        !balances?.[token.key] || balances[token.key].balance?.amount === '0',
    );

    // Combine them, prioritizing tokens with balances
    const combinedTokens = [...tokensWithBalance, ...tokensWithoutBalance];

    // Take only the first N tokens for initial price fetch
    for (const token of combinedTokens) {
      if (priorityTokens.length >= MAX_INITIAL_PRICE_FETCHES) break;
      if (!priorityTokens.find((t) => t.key === token.key)) {
        priorityTokens.push(token);
      }
    }

    return priorityTokens;
  }, [sortedTokens, isTokenPickerOpen, searchQuery, selectedToken, balances]);

  const tokenPrices = useMemo(
    () => getTokenPrices(tokensForPriceFetch),
    [getTokenPrices, tokensForPriceFetch],
  );

  return {
    sortedTokens,
    tokenPrices,
  };
};
