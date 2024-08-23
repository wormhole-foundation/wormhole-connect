import { useState, useEffect, useMemo } from 'react';
import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';

import { getTokenDecimals } from 'utils';
import config from 'config';
import { toDecimals } from 'utils/balance';

type RoutesQuotesBulkParams = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  destToken: string;
  amount: number;
  nativeGas: number;
};

export type RouteQuote = {
  error: string;
  eta: number;
  receiveAmount: string;
  receiveNativeAmount: number;
  relayerFee: number;
};

type HookReturn = {
  quotesMap: Record<string, RouteQuote | undefined>;
  isFetching: boolean;
};

const defaultQuote: RouteQuote = {
  error: '',
  eta: 0,
  receiveAmount: '',
  receiveNativeAmount: 0,
  relayerFee: 0,
};

const useRoutesQuotesBulk = (
  routes: string[],
  params: RoutesQuotesBulkParams,
): HookReturn => {
  const [isFetching, setIsFetching] = useState(false);
  const [quotes, setQuotes] = useState<RouteQuote[]>([]);

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

    const promises = routes.map((route) =>
      config.routes
        .get(route)
        .computeQuote(
          params.amount,
          params.sourceToken,
          params.destToken,
          params.sourceChain,
          params.destChain,
          { nativeGas: params.nativeGas },
        ),
    );

    setIsFetching(true);
    Promise.allSettled(promises).then((results) => {
      const quotes = results.map((result) => {
        if (result.status === 'rejected') {
          return {
            ...defaultQuote,
            error: result.reason.toString(),
          };
        }
        if (!result.value.success) {
          return {
            ...defaultQuote,
            error: result.value.error.message,
          };
        }

        const quote = result.value;
        const receiveAmount = sdkAmount
          .whole(quote.destinationToken.amount)
          .toString();
        const receiveNativeAmount = quote.destinationNativeGas
          ? sdkAmount.whole(quote.destinationNativeGas)
          : 0;
        const eta = quote.eta ?? 0;
        let relayerFee = 0;

        if (quote.relayFee && params.sourceChain) {
          const { token, amount } = quote.relayFee;
          const feeToken = config.sdkConverter.toTokenIdV1(token);
          const decimals = getTokenDecimals(params.sourceChain, feeToken);
          relayerFee = Number.parseFloat(
            toDecimals(amount.amount, decimals, 6),
          );
        }

        return {
          error: '',
          receiveAmount,
          receiveNativeAmount,
          eta,
          relayerFee,
        };
      });
      if (!unmounted) {
        setQuotes(quotes);
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
      routes.reduce(
        (acc, route, index) => ({
          ...acc,
          [route]: quotes[index],
        }),
        {} as Record<string, RouteQuote | undefined>,
      ),
    [routes.join(), quotes],
  );

  return {
    quotesMap,
    isFetching,
  };
};

export default useRoutesQuotesBulk;
