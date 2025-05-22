import { useMemo } from 'react';
import { circle, isNative } from '@wormhole-foundation/sdk';
import type { ChainConfig } from 'config/types';
import {
  isSameToken,
  Token,
  tokenKey,
  isTokenTuple,
  tokenIdFromTuple,
} from 'config/tokens';
import type { WalletData } from 'store/wallet';
import { calculateUSDPriceRaw, isFrankensteinToken } from 'utils';
import config from 'config';
import { useTokens } from 'contexts/TokensContext';

interface UseDestTokenListParams {
  tokenList: Token[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  wallet: WalletData;
  balances: Record<string, { balance: any }>;
}

export const useDestTokenList = ({
  tokenList,
  searchQuery,
  selectedChainConfig,
  selectedToken,
  sourceToken,
  wallet,
  balances,
}: UseDestTokenListParams) => {
  const { getTokenPrice } = useTokens();

  return useMemo(() => {
    if (!tokenList) return [];

    const unsortedTokens = [...tokenList];

    // Apply search input - find tokens with exact match of address, or partial match of symbol
    if (searchQuery) {
      let searchResults: Token[] = [];
      const byAddress = config.tokens.get(
        selectedChainConfig.sdkName,
        searchQuery,
      );
      if (byAddress) {
        searchResults.push(byAddress);
      }

      const queryResults = config.tokens
        .queryBySymbol(selectedChainConfig.sdkName, searchQuery)
        .filter(
          (t: Token) => !isFrankensteinToken(t, selectedChainConfig.sdkName),
        );

      if (queryResults.length > 0) {
        searchResults = searchResults.concat(queryResults);
      }

      for (const result of searchResults) {
        if (!tokenList.find((existing) => isSameToken(result, existing))) {
          unsortedTokens.push(result);
        }
      }
    }

    // Returns a score for a given token used when sorting destination tokens
    const tokenPreferenceScore = (token: Token) => {
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

    const usdBalance = (token: Token): number => {
      const balance = balances[tokenKey(token)];
      if (!balance || !balance.balance) {
        return 0;
      }
      return calculateUSDPriceRaw(getTokenPrice, balance.balance, token) ?? 0;
    };

    let sorted = unsortedTokens.sort((a, b) => {
      const scoreA = tokenPreferenceScore(a);
      const scoreB = tokenPreferenceScore(b);
      if (scoreA > scoreB) return -1;
      if (scoreB > scoreA) return 1;

      const balanceA = usdBalance(a);
      const balanceB = usdBalance(b);
      if (balanceA !== balanceB) {
        return balanceB - balanceA;
      } else {
        // If equal scores and USD balance, compare by symbol
        return a.symbol.localeCompare(b.symbol);
      }
    });

    // Apply token whitelist filtering if configured
    if (config.tokenWhitelist && config.tokenWhitelist.length > 0) {
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

        for (const token of sorted) {
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

      sorted = sorted.filter((token) =>
        filteredTokens.has(token.address.toString()),
      );
    }

    // Apply custom token support handler if configured
    if (config.isTokenSupportedHandler) {
      sorted = sorted.filter(config.isTokenSupportedHandler);
    }

    // Destination tokens don't filter by balance like source tokens

    return sorted;
  }, [
    tokenList,
    searchQuery,
    selectedChainConfig.sdkName,
    selectedToken,
    sourceToken,
    wallet.address,
    balances,
    getTokenPrice,
  ]);
};
