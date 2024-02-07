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
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchTokenPrices = async () => {
      while (!cancelled) {
        try {
          // Since TOKENS is constant we assign this controlled value with the coingecko ids
          const coingeckoIds =
            'ethereum,usd-coin,wrapped-bitcoin,tether,dai,matic-network,binancecoin,avalanche-2,fantom,celo,moonbeam,solana,sui,aptos,osmosis,tbtc,wrapped-steth,sei-network,cosmos-hub,evmos,kujira,klay-token,wrapped-klay';

          // Make API call to fetch token prices
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`,
            { signal },
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
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
