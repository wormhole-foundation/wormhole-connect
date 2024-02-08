import { COINGECKO_API_KEY, TOKENS } from 'config';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPrices, setPricesError } from 'store/tokenPrices';
import { sleep } from 'utils';

const PRICES_FETCH_INTERVAL = 60000 * 5; // 5 mins
const COINGECKO_URL = 'https://api.coingecko.com/';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com/';

const COINGECKO_IDS = Object.values(TOKENS)
  .filter((config) => !!config.coinGeckoId)
  .map(({ coinGeckoId }) => coinGeckoId)
  .join(',');

export const useFetchTokenPrices = (): void => {
  const dispatch = useDispatch();
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const signal = controller.signal;
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(COINGECKO_API_KEY
        ? { 'x-cg-pro-api-key': COINGECKO_API_KEY || '' }
        : {}),
    });
    const fetchTokenPrices = async () => {
      while (!cancelled) {
        try {
          // Make API call to fetch token prices
          // In the case the user https://apiguide.coingecko.com/getting-started/getting-started#id-2.-making-api-request
          const res = await fetch(
            `${
              !COINGECKO_API_KEY ? COINGECKO_URL : COINGECKO_URL_PRO
            }api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd${
              !COINGECKO_API_KEY ? '' : `?x_cg_pro_api_key=${COINGECKO_API_KEY}`
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
