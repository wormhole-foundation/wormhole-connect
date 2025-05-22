import type { ChainConfig } from 'config/types';
import { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import { useTokenList } from './useTokenList';

interface UseDestTokenListParams {
  tokenList: Token[];
  searchQuery: string;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  wallet: WalletData;
  balances: Record<string, { balance: any }>;
}

export const useDestTokenList = (params: UseDestTokenListParams) => {
  return useTokenList({
    ...params,
    filterByBalance: false,
  });
};
