import { useState, useEffect, useMemo } from 'react';
import { Chain, routes } from '@wormhole-foundation/sdk';
import { QuoteParams } from 'routes/operator';

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

  return {
    quotesMap,
    isFetching,
  };
};

export default useRoutesQuotesBulk;
