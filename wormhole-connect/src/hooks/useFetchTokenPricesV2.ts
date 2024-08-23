import config from 'config';
import { useEffect, useState } from 'react';

import type { TokenPrices } from 'store/tokenPrices';

const COINGECKO_URL = 'https://api.coingecko.com/';
const COINGECKO_URL_PRO = 'https://pro-api.coingecko.com/';

const useFetchTokenPricesV2 = (): {
  prices: TokenPrices;
  error: string;
  isFetching: boolean;
} => {
  const [prices, setPrices] = useState({});
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let cancelled = false;

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
      setIsFetching(true);

      try {
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
          { headers },
        );

        const data = await res.json();

        if (!cancelled) {
          setPrices(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(`Error fetching token prices: ${error}`);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchTokenPrices();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    prices,
    error,
    isFetching,
  };
};

export default useFetchTokenPricesV2;
