import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import {
  Wormhole,
  Chain,
  Network,
  routes,
  circle,
  amount,
} from '@wormhole-foundation/sdk';
import { QuoteParams, QuoteResult } from 'routes/operator';
import { calculateUSDPriceRaw } from 'utils';

import config from 'config';

type Params = {
  sourceChain?: Chain;
  sourceToken: string;
  destChain?: Chain;
  destToken: string;
  amount: string;
  nativeGas: number;
};

type HookReturn = {
  quotesMap: Record<string, QuoteResult | undefined>;
  isFetching: boolean;
};

const QUOTE_REFRESH_INTERVAL = 20_000;

const MAYAN_BETA_LIMIT = 10_000; // USD
const MAYAN_BETA_PROTOCOLS = ['MCTP', 'SWIFT'];

const useRoutesQuotesBulk = (routes: string[], params: Params): HookReturn => {
  const [nonce, setNonce] = useState(new Date().valueOf());
  const [refreshTimeout, setRefreshTimeout] = useState<null | ReturnType<
    typeof setTimeout
  >>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);

  // TODO temporary
  // Calculate USD amount for temporary $10,000 Mayan limit
  const sourceTokenConfig = config.tokens[params.sourceToken];
  const destTokenConfig = config.tokens[params.destToken];
  const { usdPrices } = useSelector((state: RootState) => state.tokenPrices);
  const { isTransactionInProgress } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const usdValue = calculateUSDPriceRaw(
    params.amount,
    usdPrices.data,
    sourceTokenConfig,
  );

  useEffect(() => {
    let unmounted = false;
    if (
      !params.sourceChain ||
      !params.sourceToken ||
      !params.destChain ||
      !params.destToken ||
      !parseFloat(params.amount)
    ) {
      return;
    }

    // Forcing TS to infer that fields are non-optional
    const rParams = params as Required<QuoteParams>;

    const onComplete = () => {
      // Refresh quotes in 20 seconds
      const refreshTimeout = setTimeout(
        () => setNonce(new Date().valueOf()),
        QUOTE_REFRESH_INTERVAL,
      );
      setRefreshTimeout(refreshTimeout);
    };

    if (isTransactionInProgress) {
      // Don't fetch new quotes if the user has committed to one and has initiated a transaction
      onComplete();
    } else {
      setIsFetching(true);
      config.routes.getQuotes(routes, rParams).then((quoteResults) => {
        if (!unmounted) {
          setQuotes(quoteResults);
          setIsFetching(false);
          onComplete();
        }
      });
    }

    return () => {
      unmounted = true;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [
    routes.join(),
    params.sourceChain,
    params.sourceToken,
    params.destChain,
    params.destToken,
    params.amount,
    params.nativeGas,
    nonce,
    isTransactionInProgress,
  ]);

  const quotesMap = useMemo(
    () =>
      routes.reduce((acc, route, index) => {
        acc[route] = quotes[index];
        return acc;
      }, {} as Record<string, QuoteResult | undefined>),
    [routes.join(), quotes],
  );

  // Filter out quotes that would result in a large instant loss
  // (Transfers >=$1000 with >=10% value loss)
  for (const name in quotesMap) {
    const quote = quotesMap[name];
    if (quote !== undefined && quote.success) {
      const usdValueOut = calculateUSDPriceRaw(
        amount.whole(quote.destinationToken.amount),
        usdPrices.data,
        destTokenConfig,
      );

      if (usdValue && usdValueOut) {
        const valueRatio = usdValueOut / usdValue;
        if (usdValue >= 1000 && valueRatio <= 0.9) {
          delete quotesMap[name];
        }
      }
    }
  }

  // TODO temporary logic for beta Mayan support
  for (const name in quotesMap) {
    if (name.startsWith('MayanSwap')) {
      const mayanQuote = quotesMap[name];

      if (
        mayanQuote !== undefined &&
        mayanQuote.success &&
        MAYAN_BETA_PROTOCOLS.includes(mayanQuote.details?.type.toUpperCase())
      ) {
        // There are two special cases here for Mayan Swift transfers
        //
        // 1) Disallow transfers >$10,000 (temporary, while in beta)
        // 2) For transfers <=$10,000, calculate network costs manually, because Mayan API doesn't
        //    expose relayer fee info for Swift quotes.
        //
        // TODO all of the code here is horrible and would ideally not exist

        if (usdValue !== undefined && usdValue > MAYAN_BETA_LIMIT) {
          // Temporarily disallow Swift quotes above $10,000
          // TODO revisit this
          quotesMap[name] = {
            success: false,
            error: new Error(
              `Amount exceeds limit of $${MAYAN_BETA_LIMIT} USD`,
            ),
          };
        } else {
          const approxInputUsdValue = calculateUSDPriceRaw(
            params.amount,
            usdPrices.data,
            sourceTokenConfig,
          );
          const approxOutputUsdValue = calculateUSDPriceRaw(
            amount.display(mayanQuote.destinationToken.amount),
            usdPrices.data,
            config.tokens[params.destToken],
          );

          if (approxInputUsdValue && approxOutputUsdValue) {
            const approxUsdNetworkCost =
              approxInputUsdValue - approxOutputUsdValue;

            if (!isNaN(approxUsdNetworkCost) && approxUsdNetworkCost > 0) {
              (quotesMap[name] as routes.Quote<Network>).relayFee = {
                token: {
                  chain: 'Solana' as Chain,
                  address: Wormhole.parseAddress(
                    'Solana',
                    circle.usdcContract.get('Mainnet', 'Solana') as string,
                  ),
                },
                amount: amount.parse(
                  amount.denoise(approxUsdNetworkCost, 6),
                  6,
                ),
              };
            }
          }
        }
      }
    }
  }
  // TODO end Mayan beta support special logic

  return {
    quotesMap,
    isFetching,
  };
};

export default useRoutesQuotesBulk;
