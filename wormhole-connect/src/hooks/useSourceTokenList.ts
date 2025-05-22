import type { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import { useTokenList } from './useTokenList';

interface UseSourceTokenListParams {
  tokenList: Token[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  wallet: WalletData;
  balances: Record<string, { balance: any }>;
}

export const useSourceTokenList = (params: UseSourceTokenListParams) => {
  return useTokenList({
    ...params,
    filterByBalance: true,
  });
};
