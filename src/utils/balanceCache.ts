import { amount, Chain } from '@wormhole-foundation/sdk';
import { Token } from 'config/tokens';
import { WalletData } from 'store/wallet';

interface BalanceCache {
  balance: amount.Amount;
  lastUpdated: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const cache: Record<string, BalanceCache> = {};
const failedTokens: Set<string> = new Set();

const cacheKey = (wallet: string, token: Token): string => {
  return `${token.chain}:${wallet}:${token.addressString}`;
};

const getCached = (wallet: WalletData, token: Token): BalanceCache | null => {
  const key = cacheKey(wallet.address, token);
  const cached = cache[key];
  const now = Date.now();

  if (cached && cached.lastUpdated > now - CACHE_DURATION_MS) {
    return cached;
  }
  return null;
};

const setCached = (
  wallet: WalletData,
  token: Token,
  balance: amount.Amount,
): void => {
  const key = cacheKey(wallet.address, token);
  cache[key] = {
    balance,
    lastUpdated: Date.now(),
  };
};

const markFailed = (chain: Chain, tokenAddr: string): void => {
  failedTokens.add(`${chain}:${tokenAddr}`);
};

const isFailed = (chain: Chain, tokenAddr: string): boolean => {
  return failedTokens.has(`${chain}:${tokenAddr}`);
};

export { getCached, setCached, markFailed, isFailed };
