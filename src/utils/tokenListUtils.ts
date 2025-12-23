import {
  circle,
  isNative,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import {
  isSameToken,
  tokenKey,
  isTokenTuple,
  tokenIdFromTuple,
} from 'config/tokens';
import { calculateUSDPriceRaw, isFrankensteinToken } from 'utils';
import config from 'config';
import { isNttToken } from './ntt';
import type { Balances } from './wallet/types';

export const getTokenPreferenceScore = (
  token: Token,
  selectedToken?: Token,
  oppositeToken?: Token,
): number => {
  // Currently selected token should be shown first
  if (selectedToken && isSameToken(selectedToken, token)) {
    return 5;
  }
  // Prioritize tokens with same symbol as the opposite side's token
  // Exclude Wormhole-wrapped tokens from this preference
  if (
    oppositeToken &&
    token.symbol === oppositeToken.symbol &&
    !token.isTokenBridgeWrappedToken
  ) {
    return 4;
  }
  // Native gas tokens are next
  if (isNative(token.addressString)) {
    return 3;
  }
  // USDC preferred next
  const usdc = circle.usdcContract.get(config.network, token.chain);
  if (usdc && token.addressString === usdc) {
    return 2;
  }
  // Finally, prefer native non-wrapped tokens over wrapped ones
  if (!token.isTokenBridgeWrappedToken) {
    return 1;
  }
  // The rest is all the same as far as preference
  return 0;
};

export const calculateTokenUSDBalance = (
  token: Token,
  balances: Balances,
  getTokenPrice: (token: Token) => number | undefined,
): number => {
  const balance = balances[tokenKey(token)];
  if (!balance || !balance.balance || balance.balance.amount === '0') {
    return 0;
  }
  return calculateUSDPriceRaw(getTokenPrice, balance.balance, token) ?? 0;
};

export const applyTokenSearch = (
  tokenList: Token[],
  searchQuery: string,
  selectedChainConfig: ChainConfig,
): Token[] => {
  if (!searchQuery) return [...tokenList];

  const unsortedTokens = [...tokenList];
  let searchResults: Token[] = [];

  const byAddress = config.tokens.get(selectedChainConfig.sdkName, searchQuery);
  if (byAddress) {
    searchResults.push(byAddress);
  }

  const queryResults = config.tokens
    .queryBySymbol(selectedChainConfig.sdkName, searchQuery)
    .filter((t: Token) => !isFrankensteinToken(t, selectedChainConfig.sdkName));

  if (queryResults.length > 0) {
    searchResults = searchResults.concat(queryResults);
  }

  for (const result of searchResults) {
    if (!tokenList.find((existing) => isSameToken(result, existing))) {
      unsortedTokens.push(result);
    }
  }

  return unsortedTokens;
};

export const sortTokensByPreference = (
  tokens: Token[],
  selectedToken: Token | undefined,
  balances: Balances,
  getTokenPrice: (token: Token) => number | undefined,
  oppositeToken?: Token,
): Token[] => {
  return tokens.sort((a, b) => {
    const scoreA = getTokenPreferenceScore(a, selectedToken, oppositeToken);
    const scoreB = getTokenPreferenceScore(b, selectedToken, oppositeToken);
    if (scoreA > scoreB) return -1;
    if (scoreB > scoreA) return 1;

    const balanceA = calculateTokenUSDBalance(a, balances, getTokenPrice);
    const balanceB = calculateTokenUSDBalance(b, balances, getTokenPrice);

    if (balanceA !== balanceB) {
      return balanceB - balanceA;
    } else {
      // If equal scores and USD balance, compare by symbol
      return a.symbol.localeCompare(b.symbol);
    }
  });
};

export const applyTokenWhitelist = (
  tokens: Token[],
  selectedChainConfig: ChainConfig,
): Token[] => {
  if (!config.tokenWhitelist || config.tokenWhitelist.length === 0) {
    return tokens;
  }

  const filteredTokens: Set<string> = new Set();
  const desiredSymbols: string[] = [];

  for (const item of config.tokenWhitelist) {
    if (typeof item === 'string') {
      // Treated as a symbol
      desiredSymbols.push(item);
    } else if (isTokenTuple(item)) {
      const tokenId = tokenIdFromTuple(item);
      if (tokenId.chain === selectedChainConfig.sdkName) {
        filteredTokens.add(tokenId.address.toString());
      }
    }
  }

  for (const symbol of desiredSymbols) {
    let foundNative = false;
    const wrapped: Token[] = [];

    for (const token of tokens) {
      if (token.symbol === symbol) {
        if (!token.isTokenBridgeWrappedToken) {
          filteredTokens.add(token.address.toString());
          foundNative = true;
        } else {
          wrapped.push(token);
        }
      }
    }

    if (!foundNative && wrapped.length > 0) {
      for (const { address } of wrapped) {
        filteredTokens.add(address.toString());
      }

      if (wrapped.length > 1) {
        console.warn(
          `Ambiguous token whitelist item "${symbol}"; found ${wrapped.length} matching wrapped tokens.`,
        );
      }
    }
  }

  return tokens.filter((token) => filteredTokens.has(token.address.toString()));
};

export const applyCustomTokenSupport = (
  tokens: Token[],
  sourceToken?: Token,
  isSourceList?: boolean,
): Token[] => {
  const filter = config.isTokenSupportedHandler;

  if (!filter) {
    return tokens;
  }

  const tokenListType = isSourceList ? 'source' : 'destination';

  return tokens.filter((t) => filter(t, sourceToken, tokenListType));
};

export const applySpamFilter = (
  tokens: Token[],
  coingeckoAddresses?: Set<string>,
): Token[] => {
  return tokens.filter((token) => {
    // Always include NTT tokens
    if (isNttToken(token)) {
      return true;
    }

    // Always include native gas tokens
    if (token.isNativeGasToken) {
      return true;
    }

    // Always include built-in tokens configured in Connect
    if (token.isBuiltin) {
      return true;
    }

    // If CoinGecko data available, use strict filtering
    if (coingeckoAddresses && coingeckoAddresses.size > 0) {
      // For Token Bridge wrapped tokens, check the original token
      if (token.isTokenBridgeWrappedToken && token.tokenBridgeOriginalTokenId) {
        const originalToken = config.tokens.get(
          token.tokenBridgeOriginalTokenId,
        );
        if (originalToken) {
          // TODO: Use chain-aware address normalization instead of toLowerCase()
          // This breaks Solana/Sui tokens which have case-sensitive addresses
          const originalAddress = originalToken.addressString.toLowerCase();
          const isInList = coingeckoAddresses.has(originalAddress);
          if (!isInList) {
            console.debug(
              `Filtering out wrapped token (original not in CoinGecko)`,
              token,
            );
          }
          return isInList;
        }
      }

      // For regular tokens, check if address is in CoinGecko list
      // TODO: Use chain-aware address normalization instead of toLowerCase()
      // This breaks Solana/Sui tokens which have case-sensitive addresses
      const address = token.addressString.toLowerCase();
      const isInList = coingeckoAddresses.has(address);
      if (!isInList) {
        console.debug(`Filtering out token (not in CoinGecko list)`, token);
      }
      return isInList;
    }

    // Fallback to basic filtering when CoinGecko data unavailable
    const isOk = token.coingeckoWebId || token.isTokenBridgeWrappedToken;
    if (!isOk) {
      console.debug(`Filtering out token for likely being spam`, token);
    }
    return isOk;
  });
};

export const filterTokensByBalance = (
  tokens: Token[],
  balances: Record<string, { balance: any }>,
  walletAddress?: string,
): Token[] => {
  if (!walletAddress) return tokens;
  if (Object.keys(balances).length === 0) return tokens;

  return tokens.filter((t) => {
    const bal = balances[tokenKey(t)]?.balance;
    return bal && sdkAmount.units(bal) > 0;
  });
};
