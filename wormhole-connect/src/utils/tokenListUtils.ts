import {
  circle,
  isNative,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config/types';
import {
  isSameToken,
  Token,
  tokenKey,
  isTokenTuple,
  tokenIdFromTuple,
} from 'config/tokens';
import { calculateUSDPriceRaw, isFrankensteinToken } from 'utils';
import config from 'config';
import { isNttToken } from './ntt';

export const getTokenPreferenceScore = (
  token: Token,
  selectedToken?: Token,
): number => {
  // Currently selected token should be shown first
  if (selectedToken && isSameToken(selectedToken, token)) {
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
  balances: Record<string, { balance: any }>,
  getTokenPrice: (token: Token) => number | undefined,
): number => {
  const balance = balances[tokenKey(token)];
  if (!balance || !balance.balance) {
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
  balances: Record<string, { balance: any }>,
  getTokenPrice: (token: Token) => number | undefined,
): Token[] => {
  return tokens.sort((a, b) => {
    const scoreA = getTokenPreferenceScore(a, selectedToken);
    const scoreB = getTokenPreferenceScore(b, selectedToken);
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
): Token[] => {
  const filter = config.isTokenSupportedHandler;
  if (!filter) {
    return tokens;
  }
  return tokens.filter((t) => filter(t, sourceToken));
};

export const applyShittokenFilter = (tokens: Token[]): Token[] => {
  return tokens.filter((token) => {
    const isOk =
      token.isNativeGasToken ||
      token.isBuiltin ||
      token.coingeckoWebId ||
      token.isTokenBridgeWrappedToken ||
      isNttToken(token);
    if (!isOk)
      console.debug(`Filtering out token for likely being spam`, token);
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
