import { TOKENS } from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { TokenPrices, setPrices, setPricesError } from 'store/tokenPrices';
import { sleep } from 'utils';

const PRICES_FETCH_INTERVAL = 60000 * 5; // 5 mins

export const useFetchTokenPrices = () => {
  const dispatch = useDispatch();
  const usdPrices: TokenPrices = {};
  useEffect(() => {
    let cancelled = false;
    const fetchTokenPrices = async () => {
      while (!cancelled) {
        try {
          // Make API call to fetch token prices
          const idsList = [];
          for (const [, tokenConfig] of Object.entries(TOKENS)) {
            if (tokenConfig.coinGeckoId) {
              idsList.push(tokenConfig.coinGeckoId);
            }
          }
          const ids = idsList.join(',');

          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
          );
          const data = await res.json();
          if (!cancelled) {
            // Store token prices in a map
            for (const [, tokenConfig] of Object.entries(TOKENS)) {
              if (tokenConfig.coinGeckoId && data[tokenConfig.coinGeckoId]) {
                const price: number = data[tokenConfig.coinGeckoId]?.usd;
                usdPrices[tokenConfig.symbol] = price;
              }
            }
            dispatch(setPrices(usdPrices));
          }
        } catch (error) {
          if (!cancelled) {
            dispatch(setPricesError(`Error fetching token prices: ${error}`));
          }
        }
        await sleep(PRICES_FETCH_INTERVAL);
      }
    };

    fetchTokenPrices();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
