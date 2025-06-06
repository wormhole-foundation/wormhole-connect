import {
  chainToPlatform,
  circle,
  isNative,
  TokenId,
  toNative,
} from '@wormhole-foundation/sdk';
import config, { clearWormholeContextV2 } from 'config';
import { parseTokenKey, Token, tokenKey, TokenMapping } from 'config/tokens';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { fetchTokenPrices } from 'utils/coingecko';
import { useDebouncedCallback } from 'use-debounce';
import { getAddress } from 'ethers';

interface TokensContextType {
  getOrFetchToken: (tokenId: TokenId) => Promise<Token | undefined>;
  isFetchingToken: boolean;
  lastTokenCacheUpdate: Date;

  getTokenPrice: (token: Token) => number | undefined;
  getTokenPrices: (tokens: Token[]) => Map<string, number | undefined>;
  isFetchingTokenPrices: boolean;
  lastTokenPriceUpdate: Date;
}

// TokensContext offers token-related info:
// - TokenCache which contains actual Tokens, with their metadata
//   - getOrFetchToken makes this context fetch new tokens and add them to TokenCache
// - USD price index, and ability to fetch prices
//
// TODO future refactoring note:
// We're using the config.tokens singleton for now...
// Maybe we can eventually move all direct uses of config.tokens.get(...) to using this context
// and then keep it locally in here instead of inside InternalConfig
export const TokensContext = createContext<TokensContextType | undefined>(
  undefined,
);

interface TokensProviderProps {
  children: ReactNode;
}

export interface TokenPrice {
  price: number | undefined; // USD price
  timestamp: Date;
  isFetching?: boolean;
}

export const TokensProvider: React.FC<TokensProviderProps> = ({ children }) => {
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [lastTokenCacheUpdate, setLastUpdate] = useState(
    config.tokens.lastUpdate,
  );

  // Combine price-related state into a single state object to avoid race conditions
  const [priceState, setPriceState] = useState({
    prices: new TokenMapping<TokenPrice>(),
    isFetching: false,
    lastUpdate: new Date(),
  });

  // Keep refs for tracking pending fetches
  const tokenPricesToFetch = React.useRef<Set<string>>(new Set());
  const tokenPricesFetching = React.useRef<Set<string>>(new Set());

  const getOrFetchToken = useCallback(
    async (tokenId: TokenId): Promise<Token | undefined> => {
      if (
        !isNative(tokenId.address) &&
        chainToPlatform(tokenId.chain) === 'Evm'
      ) {
        // ensure address is checksummed correctly
        const addr = tokenId.address.toString();
        const checksummedAddr = getAddress(addr);
        if (addr !== checksummedAddr) {
          console.warn(
            `Correcting improperly checksummed EVM address: ${addr} -> ${checksummedAddr}`,
          );
          tokenId.address = toNative(tokenId.chain, checksummedAddr);
        }
      }

      const cached = config.tokens.get(tokenId);
      if (cached) return cached;

      try {
        setIsFetchingToken(true);
        const t = await config.tokens.addFromTokenId(tokenId);
        setLastUpdate(config.tokens.lastUpdate);
        console.info(
          `Added new token to cache`,
          t,
          lastTokenCacheUpdate,
          config.tokens.lastUpdate,
        );
        config.tokens.persist();
        clearWormholeContextV2();
        return t;
      } catch (e) {
        console.error('Error getting token', e);
        return undefined;
      } finally {
        setIsFetchingToken(false);
      }
    },
    [],
  );

  const updateTokenPrices = useDebouncedCallback(async () => {
    if (tokenPricesToFetch.current.size === 0) return;

    const tokens = Array.from(tokenPricesToFetch.current.values()).map((t) =>
      parseTokenKey(t),
    );

    try {
      const timestamp = new Date();
      const newPrices = priceState.prices.clone();

      // Flag that this price is being fetched
      for (const token of tokens) {
        newPrices.add(token, {
          timestamp,
          price: undefined,
          isFetching: true,
        });
      }

      setPriceState((prev) => ({
        ...prev,
        isFetching: true,
        prices: newPrices,
      }));

      // Clear list for future invocations of getTokenPrice
      for (const token of tokens) {
        tokenPricesFetching.current.add(tokenKey(token));
      }
      tokenPricesToFetch.current.clear();

      console.info('Fetching token prices', tokens);

      const prices = await fetchTokenPrices(tokens);
      const updatedPrices = priceState.prices.clone();

      for (const token of tokens) {
        const price = prices.get(token);
        updatedPrices.add(token, {
          timestamp,
          price: price ?? undefined,
        });
      }

      tokenPricesFetching.current.clear();
      setPriceState({
        prices: updatedPrices,
        isFetching: false,
        lastUpdate: new Date(),
      });
    } catch (e) {
      console.error(e);
      setPriceState((prev) => ({ ...prev, isFetching: false }));
    }
  }, 250);

  // Helper function to get cached price or determine if token is USDC
  const getCachedPriceOrUSDC = (
    token: Token,
  ): { price: number | undefined; needsFetch: boolean } => {
    const usdc = circle.usdcContract.get(config.network, token.chain);
    if (usdc && token.addressString === usdc) {
      // USDC is a special case since it's a stablecoin and its price is always 1 USD.
      return { price: 1, needsFetch: false };
    }

    // For wrapped tokens, use the original token's price
    const tokenId = token.tokenBridgeOriginalTokenId ?? token;
    const cachedPrice = priceState.prices.get(tokenId);

    // If we have a cached entry (even if price is undefined), don't fetch again
    if (cachedPrice) {
      return { price: cachedPrice.price, needsFetch: false };
    }

    return { price: undefined, needsFetch: true };
  };

  const getTokenPrice = useCallback(
    (token: Token): number | undefined => {
      const { price, needsFetch } = getCachedPriceOrUSDC(token);

      if (!needsFetch) {
        return price;
      }

      // Trigger fetch if not already being fetched
      const tokenId = token.tokenBridgeOriginalTokenId ?? token;
      if (!tokenPricesFetching.current.has(tokenKey(tokenId))) {
        tokenPricesToFetch.current.add(tokenKey(tokenId));
        updateTokenPrices();
      }

      return undefined;
    },
    [updateTokenPrices, priceState.prices],
  );

  const batchFetchingTokens = useRef<Set<string>>(new Set());

  const getTokenPrices = useCallback(
    (tokens: Token[]): Map<string, number | undefined> => {
      const priceMap = new Map<string, number | undefined>();
      const tokensNeedingFetch: Token[] = [];

      // Collect current prices and identify tokens needing fetch
      for (const token of tokens) {
        const { price, needsFetch } = getCachedPriceOrUSDC(token);

        priceMap.set(token.key, price);

        if (needsFetch) {
          const tokenId = token.tokenBridgeOriginalTokenId ?? token;
          const tokenKeyStr = tokenKey(tokenId);

          // Only add to fetch list if not already being fetched
          if (
            !batchFetchingTokens.current.has(tokenKeyStr) &&
            !tokenPricesFetching.current.has(tokenKeyStr)
          ) {
            tokensNeedingFetch.push(token);
            batchFetchingTokens.current.add(tokenKeyStr);
          }
        }
      }

      // Trigger fetch for missing prices
      if (tokensNeedingFetch.length > 0) {
        // Immediately trigger fetch for all tokens that need prices
        const fetchPrices = async () => {
          try {
            console.info(
              'Fetching prices for',
              tokensNeedingFetch.length,
              'tokens',
            );
            const timestamp = new Date();
            const prices = await fetchTokenPrices(tokensNeedingFetch);
            const updatedPrices = priceState.prices.clone();

            // Process all tokens, even if they don't have prices
            for (const token of tokensNeedingFetch) {
              const tokenId = token.tokenBridgeOriginalTokenId ?? token;
              const price = prices.get(tokenId);

              // Update cache - store undefined if price fetch failed
              updatedPrices.add(tokenId, {
                timestamp,
                price: price ?? undefined,
              });

              // Remove from fetching set
              batchFetchingTokens.current.delete(tokenKey(tokenId));
            }

            // Update state to trigger re-render
            setPriceState({
              prices: updatedPrices,
              isFetching: false,
              lastUpdate: new Date(),
            });
          } catch (e) {
            console.error('Error fetching token prices:', e);
            // On error, still cache the failed attempts to prevent infinite retries
            const timestamp = new Date();
            const updatedPrices = priceState.prices.clone();

            for (const token of tokensNeedingFetch) {
              const tokenId = token.tokenBridgeOriginalTokenId ?? token;

              // Cache as undefined to prevent re-fetching
              updatedPrices.add(tokenId, {
                timestamp,
                price: undefined,
              });

              batchFetchingTokens.current.delete(tokenKey(tokenId));
            }

            // Update state
            setPriceState({
              prices: updatedPrices,
              isFetching: false,
              lastUpdate: new Date(),
            });
          }
        };

        // Execute fetch without awaiting
        fetchPrices();
      }

      return priceMap;
    },
    [priceState.prices],
  );

  return (
    <TokensContext.Provider
      value={{
        lastTokenCacheUpdate,
        getOrFetchToken,
        isFetchingToken,

        getTokenPrice,
        getTokenPrices,
        isFetchingTokenPrices: priceState.isFetching,
        lastTokenPriceUpdate: priceState.lastUpdate,
      }}
    >
      {children}
    </TokensContext.Provider>
  );
};

export const useTokens = (): TokensContextType => {
  const context = useContext(TokensContext);
  if (context === undefined) {
    throw new Error('useToken must be used within a TokensProvider');
  }
  return context;
};
