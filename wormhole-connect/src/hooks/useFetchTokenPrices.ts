import config from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPrices, setPricesError } from 'store/tokenPrices';
import { sleep } from 'utils';

const PRICES_FETCH_INTERVAL = 60000 * 5; // 5 mins
const COINGECKO_URL = 'https://api.coingecko.com/';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com/';

export const useFetchTokenPrices = (): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchTokenPrices = async () => {
      while (!cancelled) {
        try {
          /** arbitrary delay to read from config mutable object after all sync and react's async processes affecting config have been queued  */
          await sleep(10);
          const headers = new Headers({
            'Content-Type': 'application/json',
            ...(config.coinGeckoApiKey
              ? { 'x-cg-pro-api-key': config.coinGeckoApiKey }
              : {}),
          });
          const coingeckoIds = Object.values(config.tokens)
            .filter((config) => !!config.coinGeckoId)
            .map(({ coinGeckoId }) => coinGeckoId)
            .join(',');
          // Make API call to fetch token prices
          // In the case the user https://apiguide.coingecko.com/getting-started/getting-started#id-2.-making-api-request
          const res = await fetch(
            `${
              !config.coinGeckoApiKey ? COINGECKO_URL : COINGECKO_URL_PRO
            }api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd${
              !config.coinGeckoApiKey
                ? ''
                : `?x_cg_pro_api_key=${config.coinGeckoApiKey}`
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
        }
        await sleep(PRICES_FETCH_INTERVAL);
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
