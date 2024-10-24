import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { routes } from '@wormhole-foundation/sdk';
import useRoutesQuotesBulk from 'hooks/useRoutesQuotesBulk';
import config from 'config';
import useFetchSupportedRoutes from './useFetchSupportedRoutes';

type Quote = routes.Quote<
  routes.Options,
  routes.ValidatedTransferParams<routes.Options>
>;

export type RouteWithQuote = {
  route: string;
  quote: Quote;
};

type HookReturn = {
  allSupportedRoutes: string[];
  sortedRoutes: string[];
  sortedRoutesWithQuotes: RouteWithQuote[];
  quotesMap: ReturnType<typeof useRoutesQuotesBulk>['quotesMap'];
  isFetching: boolean;
};

export const useSortedRoutesWithQuotes = (): HookReturn => {
  const { amount, fromChain, token, toChain, destToken, preferredRouteName } =
    useSelector((state: RootState) => state.transferInput);

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const { supportedRoutes, isFetching: isFetchingSupportedRoutes } =
    useFetchSupportedRoutes();

  const useQuotesBulkParams = useMemo(
    () => ({
      amount,
      sourceChain: fromChain,
      sourceToken: token,
      destChain: toChain,
      destToken,
      nativeGas: toNativeToken,
    }),
    [parseFloat(amount), fromChain, token, toChain, destToken, toNativeToken],
  );

  const { quotesMap, isFetching: isFetchingQuotes } = useRoutesQuotesBulk(
    supportedRoutes,
    useQuotesBulkParams,
  );

  const routesWithQuotes = useMemo(() => {
    return supportedRoutes
      .map((route) => {
        const quote = quotesMap[route];
        if (quote?.success) {
          return {
            route,
            quote,
          };
        } else {
          return undefined;
        }
      })
      .filter(Boolean) as RouteWithQuote[];
    // Safe to cast, as falsy values are filtered
  }, [supportedRoutes, quotesMap]);

  // Only routes with quotes are sorted.
  const sortedRoutesWithQuotes = useMemo(() => {
    return [...routesWithQuotes].sort((routeA, routeB) => {
      const routeConfigA = config.routes.get(routeA.route);
      const routeConfigB = config.routes.get(routeB.route);

      // Prioritize preferred route to avoid flickering the UI
      // when the preferred route gets autoselected
      if (preferredRouteName) {
        if (routeA.route === preferredRouteName) {
          return -1;
        } else if (routeB.route === preferredRouteName) {
          return 1;
        }
      }

      // 1. Prioritize automatic routes
      if (routeConfigA.AUTOMATIC_DEPOSIT && !routeConfigB.AUTOMATIC_DEPOSIT) {
        return -1;
      } else if (
        !routeConfigA.AUTOMATIC_DEPOSIT &&
        routeConfigB.AUTOMATIC_DEPOSIT
      ) {
        return 1;
      }

      // 2. Prioritize estimated time
      if (routeA.quote.eta && routeB.quote.eta) {
        if (routeA.quote.eta > routeB.quote.eta) {
          return 1;
        } else if (routeA.quote.eta < routeB.quote.eta) {
          return -1;
        }
      }

      // 3. Compare destination token amounts
      const destAmountA = BigInt(routeA.quote.destinationToken.amount.amount);
      const destAmountB = BigInt(routeB.quote.destinationToken.amount.amount);
      // Note: Sort callback return strictly expects Number
      // Returning BigInt results in TypeError
      return Number(destAmountB - destAmountA);
    });
  }, [routesWithQuotes]);

  const sortedRoutes = useMemo(
    () => sortedRoutesWithQuotes.map((r) => r.route),
    [sortedRoutesWithQuotes],
  );

  return useMemo(
    () => ({
      allSupportedRoutes: supportedRoutes,
      sortedRoutes,
      sortedRoutesWithQuotes,
      quotesMap,
      isFetching: isFetchingSupportedRoutes || isFetchingQuotes,
    }),
    [
      supportedRoutes,
      sortedRoutesWithQuotes,
      quotesMap,
      isFetchingSupportedRoutes,
      isFetchingQuotes,
    ],
  );
};
