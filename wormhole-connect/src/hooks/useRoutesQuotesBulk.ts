import { useState, useEffect, useMemo } from 'react';
import { Chain, amount as sdkAmount, routes } from '@wormhole-foundation/sdk';

import { getTokenDecimals } from 'utils';
import config from 'config';
import { toDecimals } from 'utils/balance';

type RoutesQuotesBulkParams = {
  sourceChain?: Chain;
  sourceToken: string;
  destChain?: Chain;
  destToken: string;
  amount: string;
  nativeGas: number;
};

export type ParsedQuote = {
  error?: string;
  eta?: number;
  receiveAmount: string;
  receiveNativeAmount: number;
  relayerFee?: number;
};

type HookReturn = {
  quotesMap: Record<string, ParsedQuote | undefined>;
  isFetching: boolean;
};

const defaultQuote: ParsedQuote = {
  error: '',
  eta: 0,
  receiveAmount: '',
  receiveNativeAmount: 0,
  relayerFee: 0,
};

const parseQuote = (
  quote: routes.QuoteResult<routes.Options>,
  sourceChain: Chain,
): ParsedQuote => {
  if (!quote.success) {
    return {
      ...defaultQuote,
      error: quote.error.message,
    };
  }

  const receiveAmount = sdkAmount
    .whole(quote.destinationToken.amount)
    .toString();
  const receiveNativeAmount = quote.destinationNativeGas
    ? sdkAmount.whole(quote.destinationNativeGas)
    : 0;
  const eta = quote.eta;
  let relayerFee: number | undefined = undefined;

  if (quote.relayFee) {
    const { token, amount } = quote.relayFee;
    const feeToken = config.sdkConverter.toTokenIdV1(token);
    const decimals = getTokenDecimals(sourceChain, feeToken);
    relayerFee = Number.parseFloat(toDecimals(amount.amount, decimals, 6));
  }

  return {
    receiveAmount,
    receiveNativeAmount,
    eta,
    relayerFee,
  };
};

const useRoutesQuotesBulk = (
  routes: string[],
  params: RoutesQuotesBulkParams,
): HookReturn => {
  const [isFetching, setIsFetching] = useState(false);
  const [quotes, setQuotes] = useState<ParsedQuote[]>([]);

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
    const rParams = params as Required<RoutesQuotesBulkParams>;
    const promises = config.routes.computeMultipleQuotes(routes, rParams);

    setIsFetching(true);
    Promise.allSettled(promises).then((results) => {
      const quotes = results.map((result) => {
        if (result.status === 'rejected') {
          return {
            ...defaultQuote,
            error: result.reason.toString(),
          };
        }
        return parseQuote(result.value, rParams.sourceChain);
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
        {} as Record<string, ParsedQuote | undefined>,
      ),
    [routes.join(), quotes],
  );

  return {
    quotesMap,
    isFetching,
  };
};

export default useRoutesQuotesBulk;
