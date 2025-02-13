import {
  chainToPlatform,
  isNative,
  TokenId,
  toNative,
} from '@wormhole-foundation/sdk';
import config, { clearWormholeContextV2 } from 'config';
import { Token, TokenMapping } from 'config/tokens';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { fetchTokenPrices } from 'utils/coingecko';
import { useDebouncedCallback } from 'use-debounce';
import { getAddress } from 'ethers';

interface TokensContextType {
  getOrFetchToken: (tokenId: TokenId) => Promise<Token | undefined>;
  isFetchingToken: boolean;
  lastTokenCacheUpdate: Date;

  getTokenPrice: (token: Token) => number | undefined;
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

  const [tokenPrices, _setTokenPrices] = useState<TokenMapping<TokenPrice>>(
    new TokenMapping(),
  );
  const [tokenPricesToFetch, _setTokenPricesToFetch] = useState<
    TokenMapping<boolean>
  >(new TokenMapping());

  const [isFetchingTokenPrices, setIsFetchingPrices] = useState(false);
  const [lastTokenPriceUpdate, setLastPriceUpdate] = useState(new Date());

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
    if (tokenPricesToFetch.empty) return;

    const tokens = tokenPricesToFetch.getAllTokenIds();
    console.info('Fetching token prices', tokens);

    try {
      setIsFetchingPrices(true);
      const timestamp = new Date();

      // Flag that this price is being fetched, so that we don't start another concurrent request for it in getTokenPrice
      for (const token of tokens) {
        tokenPrices.add(token, {
          timestamp,
          price: undefined,
          isFetching: true,
        });
      }

      // Clear list for future invocations of getTokenPrice
      tokenPricesToFetch.clear();

      const prices = await fetchTokenPrices(tokens);

      for (const token of tokens) {
        const price = prices.get(token);
        if (price) {
          tokenPrices.add(token, {
            timestamp,
            price,
          });
        } else {
          tokenPrices.add(token, {
            timestamp,
            price: undefined,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingPrices(false);
      setLastPriceUpdate(new Date());
    }
  }, 250);

  const getTokenPrice = (token: Token): number | undefined => {
    // For wrapped tokens, we use the original token's price since they are equivalent.
    const tokenId = token.tokenBridgeOriginalTokenId ?? token;
    const cachedPrice = tokenPrices.get(tokenId);

    if (cachedPrice) {
      return cachedPrice.price;
    } else {
      tokenPricesToFetch.add(tokenId, true);
      updateTokenPrices();
      return undefined;
    }
  };

  return (
    <TokensContext.Provider
      value={{
        lastTokenCacheUpdate,
        getOrFetchToken,
        isFetchingToken,

        getTokenPrice,
        isFetchingTokenPrices,
        lastTokenPriceUpdate,
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
