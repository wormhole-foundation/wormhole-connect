import { useCallback } from 'react';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { Token } from 'config/tokens';
import { useTokens } from 'contexts/TokensContext';

export const useUSDamountGetter = (): ((args: {
  token: Token;
  amount: sdkAmount.Amount;
}) => number | undefined) => {
  const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

  return useCallback(
    ({ token, amount }) => {
      const numericAmount = sdkAmount.whole(amount);
      if (!token) return undefined;
      const tokenPrice = Number(getTokenPrice(token));
      const USDAmount = tokenPrice * numericAmount;

      return isNaN(USDAmount) ? undefined : parseFloat(USDAmount.toFixed(2));
    },
    // ES Lint complains that lastTokenPriceUpdate is unused/unnecessary here... but that's wrong.
    // We want to recompute the price after we update conversion rates.
    //
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastTokenPriceUpdate, getTokenPrice],
  );
};
