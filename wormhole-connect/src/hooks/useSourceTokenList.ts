import { useMemo } from 'react';
import type { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import { useTokens } from 'contexts/TokensContext';
import {
  applyTokenSearch,
  sortTokensByPreference,
  applyTokenWhitelist,
  applyCustomTokenSupport,
  filterTokensByBalance,
} from 'utils/tokenListUtils';

interface UseSourceTokenListParams {
  tokenList: Token[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  wallet: WalletData;
  balances: Record<string, { balance: any }>;
}

export const useSourceTokenList = ({
  tokenList,
  searchQuery,
  selectedChainConfig,
  selectedToken,
  wallet,
  balances,
}: UseSourceTokenListParams) => {
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
    tokens = applyCustomTokenSupport(tokens);

    // Source-specific filtering: only show tokens with balance > 0
    tokens = filterTokensByBalance(tokens, balances, wallet.address);

    return tokens;
  }, [
    tokenList,
    searchQuery,
    selectedChainConfig.sdkName,
    selectedToken,
    wallet.address,
    balances,
    getTokenPrice,
  ]);
};
