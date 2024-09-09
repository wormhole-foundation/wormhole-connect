import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { Chain, routes } from '@wormhole-foundation/sdk';
import { QuoteParams } from 'routes/operator';
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

type QuoteResult = routes.QuoteResult<routes.Options>;

type HookReturn = {
  quotesMap: Record<string, QuoteResult | undefined>;
  isFetching: boolean;
};

const useRoutesQuotesBulk = (routes: string[], params: Params): HookReturn => {
  const [isFetching, setIsFetching] = useState(false);
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);

  // TODO temporary
  // Calculate USD amount for temporary $1000 Mayan limit
  const tokenConfig = config.tokens[params.sourceToken];
  const { usdPrices } = useSelector((state: RootState) => state.tokenPrices);
  const usdAmount = calculateUSDPriceRaw(
    params.amount,
    usdPrices.data,
    tokenConfig,
  );

  useEffect(() => {
    let unmounted = false;
    if (
      !params.sourceChain ||
      !params.sourceToken ||
      !params.destChain ||
      !params.destToken ||
      !params.amount
    ) {
      return;
    }

    // Forcing TS to infer that fields are non-optional
    const rParams = params as Required<QuoteParams>;

    setIsFetching(true);
    config.routes.getQuotes(routes, rParams).then((quoteResults) => {
      if (!unmounted) {
        setQuotes(quoteResults);
        setIsFetching(false);
      }
    });

    return () => {
      unmounted = true;
    };
  }, [
    routes.join(),
    params.sourceChain,
    params.sourceToken,
    params.destChain,
    params.destToken,
    params.amount,
    params.nativeGas,
  ]);

  const quotesMap = useMemo(
    () =>
      routes.reduce((acc, route, index) => {
        acc[route] = quotes[index];
        return acc;
      }, {} as Record<string, QuoteResult | undefined>),
    [routes.join(), quotes],
  );

  // TODO temporary
  const mayanQuote = quotesMap['MayanSwap'];
  if (usdAmount !== undefined && usdAmount > 1000 && mayanQuote !== undefined) {
    if (
      mayanQuote.success &&
      mayanQuote.details?.type.toLowerCase() === 'swift'
    ) {
      quotesMap['MayanSwap'] = {
        success: false,
        error: new Error('Amount exceeds limit of $1000 USD'),
      };
    }
  }

  return {
    quotesMap,
    isFetching,
  };
};

export default useRoutesQuotesBulk;
