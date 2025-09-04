import { useMemo } from 'react';
import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import { useTokens } from 'contexts/TokensContext';
import type { Balances } from 'utils/wallet/types';
import {
  applyTokenSearch,
  sortTokensByPreference,
  applyTokenWhitelist,
  applyCustomTokenSupport,
  applyShittokenFilter,
} from 'utils/tokenListUtils';
import config from 'config';

interface UseTokenListParams {
  tokenList: Token[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  wallet: WalletData;
  balances: Balances;
  isSourceList?: boolean; // true for source tokens, false for destination tokens
}

export const useTokenList = ({
  tokenList,
  searchQuery,
  selectedChainConfig,
  selectedToken,
  sourceToken,
  wallet,
  balances,
  isSourceList = false,
}: UseTokenListParams): Token[] => {
  const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

  return useMemo(() => {
    if (!tokenList) return [];

    // Apply search input - find tokens with exact match of address, or partial match of symbol
    let tokens = applyTokenSearch(tokenList, searchQuery, selectedChainConfig);

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

    // For source list, we filter further because we're loading arbitrary tokens in their wallet
    if (isSourceList && !searchQuery && config.network === 'Mainnet') {
      // Filter out possible scamcoins
      tokens = applyShittokenFilter(tokens);
    }

    return tokens;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tokenList,
    searchQuery,
    selectedChainConfig,
    selectedToken,
    wallet.address,
    balances,
    getTokenPrice,
    lastTokenPriceUpdate,
    isSourceList,
    sourceToken,
  ]);
};
