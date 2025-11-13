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
  applyCoingeckoFilter,
} from 'utils/tokenListUtils';
import config from 'config';
import { useCoingeckoTokenList } from './useCoingeckoTokenList';

interface UseTokenListParams {
  tokenList: Token[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  destToken?: Token;
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
  destToken,
  wallet,
  balances,
  isSourceList = false,
}: UseTokenListParams): Token[] => {
  const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

  // Fetch CoinGecko token list for spam filtering
  const coingeckoTokens = useCoingeckoTokenList(selectedChainConfig?.sdkName);

  return useMemo(() => {
    if (!tokenList) return [];

    // Apply search input - find tokens with exact match of address, or partial match of symbol
    let tokens = applyTokenSearch(tokenList, searchQuery, selectedChainConfig);

    // For bidirectional symbol matching: use opposite side's token
    // Source list shows tokens matching dest token's symbol at top
    // Dest list shows tokens matching source token's symbol at top
    const oppositeToken = isSourceList ? destToken : sourceToken;

    tokens = sortTokensByPreference(
      tokens,
      selectedToken,
      balances,
      getTokenPrice,
      oppositeToken,
    );

    // Apply token whitelist filtering if configured
    tokens = applyTokenWhitelist(tokens, selectedChainConfig);

    // Apply custom token support handler if configured
    tokens = applyCustomTokenSupport(tokens, sourceToken, isSourceList);

    // For source list, we filter further because we're loading arbitrary tokens in their wallet
    if (isSourceList && !searchQuery && config.network === 'Mainnet') {
      // Use CoinGecko filter if available, otherwise fallback to old filter
      if (coingeckoTokens && coingeckoTokens.size > 0) {
        tokens = applyCoingeckoFilter(tokens, coingeckoTokens);
      } else {
        // Fallback to old filter while CoinGecko list is loading or unavailable
        tokens = applyShittokenFilter(tokens);
      }
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
    destToken,
    coingeckoTokens,
  ]);
};
