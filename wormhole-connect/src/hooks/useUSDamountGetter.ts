import config from 'config';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { getTokenPrice } from 'utils';

export const useUSDamountGetter = () => {
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);

  return useCallback(
    ({
      token,
      amount,
    }: {
      token: string;
      amount: string;
    }): number | undefined => {
      const prices = data || {};
      const numericAmount = Number(amount);
      const tokenPrice = Number(getTokenPrice(prices, config.tokens[token]));
      const USDAmount = tokenPrice * numericAmount;

      return isNaN(USDAmount) ? undefined : USDAmount;
    },
    [data],
  );
};
