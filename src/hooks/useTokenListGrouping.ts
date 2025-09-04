import { useMemo } from 'react';
import type { Token } from 'config/tokens';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { Balances } from 'utils/wallet';

export function useTokenListGrouping({
  sortedTokens,
  isGroupingEnabled,
  isWalletConnected,
  balances,
}: {
  sortedTokens: Token[];
  isWalletConnected: boolean;
  isGroupingEnabled: boolean;
  balances: Balances;
}): { listItems: Token[]; ownedCount: number } {
  return useMemo(() => {
    if (!isGroupingEnabled) {
      return { listItems: sortedTokens, ownedCount: 0 };
    }

    const getHasPositiveBalance = (t: Token) => {
      if (!isWalletConnected) return false;
      const bal = balances?.[t.key]?.balance;
      return bal != null && sdkAmount.units(bal) > 0n;
    };

    const native = sortedTokens.find((t) => t.isNativeGasToken);
    const nativeKey = native?.key;

    const ownedTokens = sortedTokens.filter(getHasPositiveBalance);
    const ownedKeys = new Set(ownedTokens.map((t) => t.key));

    const listItems = [
      // 1) Owned
      ...ownedTokens,
      // 2) Native (only if not owned)
      ...(native && nativeKey && !ownedKeys.has(nativeKey) ? [native] : []),
      // 3) The rest
      ...sortedTokens.filter(
        (t) => !ownedKeys.has(t.key) && t.key !== nativeKey,
      ),
    ];

    return { listItems, ownedCount: ownedTokens.length };
  }, [sortedTokens, isGroupingEnabled, isWalletConnected, balances]);
}
