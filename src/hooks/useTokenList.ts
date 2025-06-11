import { useMemo } from 'react';
import type { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import { useTokens } from 'contexts/TokensContext';
import type { Balances } from 'store/transferInput';
import {
  applyTokenSearch,
  sortTokensByPreference,
  applyTokenWhitelist,
  applyCustomTokenSupport,
  filterTokensByBalance,
} from 'utils/tokenListUtils';

interface UseTokenListParams {
  tokenList: Token[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  wallet: WalletData;
  balances: Balances;
  filterByBalance?: boolean; // true for source tokens, false for destination tokens
}

export const useTokenList = ({
  tokenList,
  searchQuery,
  selectedChainConfig,
  selectedToken,
  sourceToken,
  wallet,
  balances,
  filterByBalance = false,
}: UseTokenListParams): Token[] => {
  const { getTokenPrice } = useTokens();

  return useMemo(() => {
    if (!tokenList) return [];

    // Apply search input - find tokens with exact match of address, or partial match of symbol
    let tokens = applyTokenSearch(tokenList, searchQuery, selectedChainConfig);

    // Sort tokens by preference and balance
    tokens = sortTokensByPreference(
      tokens,
      selectedToken,
      balances,
      getTokenPrice,
    );

    // Apply token whitelist filtering if configured
    tokens = applyTokenWhitelist(tokens, selectedChainConfig);

    // Apply custom token support handler if configured
    tokens = applyCustomTokenSupport(tokens, sourceToken);

    // Conditionally filter by balance (for source tokens only)
    if (filterByBalance) {
      tokens = filterTokensByBalance(tokens, balances, wallet.address);
    }

    return tokens;
  }, [
    tokenList,
    searchQuery,
    selectedChainConfig,
    selectedToken,
    wallet.address,
    balances,
    getTokenPrice,
    filterByBalance,
    sourceToken,
  ]);
};
