import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useDeferredValue,
} from 'react';
import { toNative } from '@wormhole-foundation/sdk';
import type { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { Token } from 'config/tokens';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';
import type { Balances } from 'utils/wallet/types';
import { unionBy } from 'es-toolkit';

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
  userTokens: Token[];
  otherTokens: Token[];
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
  const { getOrFetchToken, getTokenPrices } = useTokens();
  const deferredSearch = useDeferredValue(searchQuery);

  const addTokenIfNotExists = useCallback((token: Token) => {
    // Dedupe happens later via unionBy in the memoized list.
    setSearchedTokens((prev) => [...prev, token]);
  }, []);

  useEffect(() => {
    if (!chain || !tokenPastingEnabled || !deferredSearch) {
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
              addTokenIfNotExists(fetchedToken);
            }
          });
        } else {
          addTokenIfNotExists(existing);
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
    // Merge base tokens with any fetched tokens
    let tokens = unionBy(baseTokenList, searchedTokens, (t) => t.key);

    if (deferredSearch) {
      const searchLower = deferredSearch.toLowerCase();
      tokens = tokens.filter((token) => {
        if (
          token.symbol?.toLowerCase().includes(searchLower) ||
          token.name?.toLowerCase().includes(searchLower)
        ) {
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

    // For destination token list in same-chain swaps, filter out the source token
    if (!isSource && isSameChainSwap && sourceToken) {
      tokens = tokens.filter(
        (t) => t.addressString !== sourceToken.addressString,
      );
    }

    // Sort tokens: owned tokens first, then native gas token, then rest
    // Only sort for source tokens when not searching and wallet is connected
    if (isSource && !deferredSearch && walletAddress) {
      tokens.sort((a, b) => {
        const balanceA = balances[a.key]?.balance;
        const balanceB = balances[b.key]?.balance;

        const hasBalanceA = balanceA && sdkAmount.units(balanceA) > 0;
        const hasBalanceB = balanceB && sdkAmount.units(balanceB) > 0;

        // Both have balance or both don't - check if native gas token
        if (hasBalanceA === hasBalanceB) {
          // Native gas tokens come before non-native
          if (a.isNativeGasToken && !b.isNativeGasToken) return -1;
          if (!a.isNativeGasToken && b.isNativeGasToken) return 1;

          // Same type, maintain original order
          return 0;
        }

        // Tokens with balance come first
        return hasBalanceA ? -1 : 1;
      });
    }

    return tokens;
  }, [
    baseTokenList,
    searchedTokens,
    deferredSearch,
    isSource,
    isSameChainSwap,
    sourceToken,
    balances,
    walletAddress,
  ]);

  const tokenPrices = useMemo(() => {
    return getTokenPrices([...baseTokenList, ...searchedTokens]);
  }, [getTokenPrices, baseTokenList, searchedTokens]);

  // Split tokens into user tokens and other tokens for sectioned display
  const { userTokens, otherTokens } = useMemo(() => {
    if (!isSource || !walletAddress || deferredSearch) {
      // Don't section when: not source, no wallet, or searching
      return { userTokens: [], otherTokens: sortedTokens };
    }

    const userTokensList: Token[] = [];
    const otherTokensList: Token[] = [];

    sortedTokens.forEach((token) => {
      const balance = balances[token.key]?.balance;
      const hasBalance = balance && sdkAmount.units(balance) > 0;

      if (hasBalance) {
        userTokensList.push(token);
      } else {
        otherTokensList.push(token);
      }
    });

    return { userTokens: userTokensList, otherTokens: otherTokensList };
  }, [sortedTokens, isSource, walletAddress, deferredSearch, balances]);

  return {
    sortedTokens,
    tokenPrices,
    userTokens,
    otherTokens,
  };
};
