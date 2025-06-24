import {
  chainToPlatform,
  circle,
  isNative,
  TokenId,
  toNative,
} from '@wormhole-foundation/sdk';
import config, { clearWormholeContextV2 } from 'config';
import { Token, tokenKey, TokenMapping } from 'config/tokens';
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
import { isNttToken, getNttTokenGroup } from 'utils/ntt';

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
  const tokensToFetch = useRef<Set<string>>(new Set());
  const tokensFetching = useRef<Set<string>>(new Set());

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
    [lastTokenCacheUpdate],
  );

  const getCachedPrice = useCallback(
    (token: Token): { price: number | undefined; needsFetch: boolean } => {
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
    },
    [priceState.prices],
  );

  // Helper function to apply NTT fallback prices
  const applyNttFallbackPrices = useCallback(
    (
      tokens: Token[],
      updatedPrices: TokenMapping<TokenPrice>,
      fetchedPrices: TokenMapping<number> | undefined,
      timestamp: Date,
    ) => {
      for (const token of tokens) {
        const cachedPrice = updatedPrices.get(token);

        // If token still doesn't have a price and is an NTT token
        if (!cachedPrice?.price && isNttToken(token)) {
          const alternativeTokens = getNttTokenGroup(token);

          // Check if any alternative tokens have prices
          for (const altToken of alternativeTokens) {
            // Check both fetched prices and updated cache
            let altPrice = fetchedPrices?.get(altToken);
            if (!altPrice) {
              const altCachedPrice = updatedPrices.get(altToken);
              altPrice = altCachedPrice?.price;
            }

            if (altPrice !== undefined) {
              console.debug(
                `Using price from ${altToken.symbol} on ${altToken.chain} as fallback for ${token.symbol} on ${token.chain}`,
              );

              // Cache the fallback price for the original token
              updatedPrices.add(token, {
                timestamp,
                price: altPrice,
              });
              break;
            }
          }
        }
      }
    },
    [],
  );

  // Debounced function to batch fetch token prices
  const debouncedFetchPrices = useDebouncedCallback(async () => {
    if (tokensToFetch.current.size === 0) return;

    const tokens: Token[] = [];
    for (const tokenKeyStr of tokensToFetch.current) {
      const token = config.tokens.get(tokenKeyStr);
      if (token) {
        tokens.push(token);
        tokensFetching.current.add(tokenKeyStr);
      }
    }
    tokensToFetch.current.clear();

    if (tokens.length === 0) return;

    try {
      console.info('Fetching prices for', tokens.length, 'tokens');
      const timestamp = new Date();

      setPriceState((prev) => ({ ...prev, isFetching: true }));

      const prices = await fetchTokenPrices(tokens);

      // Use functional update to avoid stale closure
      setPriceState((prev) => {
        const updatedPrices = prev.prices.clone();

        // Process all tokens, even if they don't have prices
        for (const token of tokens) {
          const tokenId = token.tokenBridgeOriginalTokenId ?? token;
          const price = prices.get(tokenId);

          // Update cache - store undefined if price fetch failed
          updatedPrices.add(tokenId, {
            timestamp,
            price: price ?? undefined,
          });

          // Remove from fetching set
          tokensFetching.current.delete(tokenKey(tokenId));
        }

        // Handle NTT fallback prices for tokens that still don't have prices
        applyNttFallbackPrices(tokens, updatedPrices, prices, timestamp);

        return {
          prices: updatedPrices,
          isFetching: false,
          lastUpdate: new Date(),
        };
      });
    } catch (e) {
      console.error('Error fetching token prices:', e);
      // On error, still cache the failed attempts to prevent infinite retries
      const timestamp = new Date();

      // Use functional update to avoid stale closure
      setPriceState((prev) => {
        const updatedPrices = prev.prices.clone();

        for (const token of tokens) {
          const tokenId = token.tokenBridgeOriginalTokenId ?? token;

          // Cache as undefined to prevent re-fetching
          updatedPrices.add(tokenId, {
            timestamp,
            price: undefined,
          });

          tokensFetching.current.delete(tokenKey(tokenId));
        }

        // Even on error, try NTT fallback using existing cached prices
        applyNttFallbackPrices(tokens, updatedPrices, undefined, timestamp);

        return {
          prices: updatedPrices,
          isFetching: false,
          lastUpdate: new Date(),
        };
      });
    }
  }, 250);

  const getTokenPrices = useCallback(
    (tokens: Token[]): Map<string, number | undefined> => {
      const priceMap = new Map<string, number | undefined>();

      // Collect current prices and identify tokens needing fetch
      for (const token of tokens) {
        const { price, needsFetch } = getCachedPrice(token);

        priceMap.set(token.key, price);

        if (needsFetch) {
          const tokenId = token.tokenBridgeOriginalTokenId ?? token;
          const tokenKeyStr = tokenKey(tokenId);

          // Only add to fetch list if not already being fetched
          if (
            !tokensFetching.current.has(tokenKeyStr) &&
            !tokensToFetch.current.has(tokenKeyStr)
          ) {
            tokensToFetch.current.add(tokenKeyStr);
          }
        }
      }

      // Trigger debounced fetch if we have tokens to fetch
      if (tokensToFetch.current.size > 0) {
        debouncedFetchPrices();
      }

      return priceMap;
    },
    [getCachedPrice, debouncedFetchPrices],
  );

  const getTokenPrice = useCallback(
    (token: Token): number | undefined => {
      // Delegate to getTokenPrices for consistency
      const prices = getTokenPrices([token]);
      return prices.get(token.key);
    },
    [getTokenPrices],
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
