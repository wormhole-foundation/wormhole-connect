import config from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  setFetchingPrices,
  setPrices,
  setPricesError,
} from 'store/tokenPrices';
import { sleep } from 'utils';

const COINGECKO_URL = 'https://api.coingecko.com/';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com/';

export const useFetchTokenPrices = (): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const signal = controller.signal;

    const coingeckoIds = Object.values(config.tokens)
      .filter((config) => !!config.coinGeckoId)
      .map(({ coinGeckoId }) => coinGeckoId)
      .join(',');

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(config.coinGeckoApiKey
        ? { 'x-cg-pro-api-key': config.coinGeckoApiKey }
        : {}),
    });
    const fetchTokenPrices = async () => {
      dispatch(setFetchingPrices());

      while (!cancelled) {
        let fetchInterval = 5 * 60 * 1000; // 5 mins
        try {
          // Make API call to fetch token prices
          // In the case the user https://apiguide.coingecko.com/getting-started/getting-started#id-2.-making-api-request
          const res = await fetch(
            `${
              !config.coinGeckoApiKey ? COINGECKO_URL : COINGECKO_URL_PRO
            }api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd${
              !config.coinGeckoApiKey
                ? ''
                : `&x_cg_pro_api_key=${config.coinGeckoApiKey}`
            }`,
            { signal, headers },
          );
          const data = await res.json();
          if (!cancelled) {
            dispatch(setPrices(data));
          }
        } catch (error) {
          if (!cancelled) {
            dispatch(setPricesError(`Error fetching token prices: ${error}`));
          }
          // If there was an error fetching token prices, retry in 30 seconds
          fetchInterval = 30 * 1000; // 30 seconds
        }
        await sleep(fetchInterval);
      }
    };

    fetchTokenPrices();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);
};
