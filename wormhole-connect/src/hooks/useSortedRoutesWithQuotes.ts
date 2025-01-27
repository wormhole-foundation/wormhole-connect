import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { routes } from '@wormhole-foundation/sdk';
import useRoutesQuotesBulk from 'hooks/useRoutesQuotesBulk';
import config from 'config';
import useFetchSupportedRoutes from './useFetchSupportedRoutes';
import { useGetTokens } from './useGetTokens';

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
  const { amount, fromChain, toChain, toNonSDKChain, preferredRouteName } =
    useSelector((state: RootState) => state.transferInput);

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const { sourceToken, destToken } = useGetTokens();

  const { supportedRoutes, isFetching: isFetchingSupportedRoutes } =
    useFetchSupportedRoutes();

  const useQuotesBulkParams = useMemo(
    () => ({
      amount,
      sourceChain: fromChain,
      sourceToken,
      destChain: toChain,
      destToken,
      nativeGas: toNativeToken,
    }),
    [amount, fromChain, sourceToken, destToken, toChain, toNativeToken],
  );

  const { quotesMap, isFetching: isFetchingQuotes } = useRoutesQuotesBulk(
    supportedRoutes,
    useQuotesBulkParams,
  );

  const routesWithQuotes = useMemo(() => {
    return supportedRoutes
      .filter((r) =>
        // When Hyperliquid chain is selected as destination, show ONLY Hyperliquid route;
        // otherwise do NOT show Hyperliquid route
        toNonSDKChain === 'Hyperliquid'
          ? r === 'HyperliquidRoute'
          : r !== 'HyperliquidRoute',
      )
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
  }, [supportedRoutes, toNonSDKChain, quotesMap]);

  // Only routes with quotes are sorted.
  const sortedRoutesWithQuotes = useMemo(() => {
    return bucketByEta(routesWithQuotes)
      .map((bucket) => {
        return bucket.sort((routeA, routeB) => {
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
          if (
            routeConfigA.AUTOMATIC_DEPOSIT &&
            !routeConfigB.AUTOMATIC_DEPOSIT
          ) {
            return -1;
          } else if (
            !routeConfigA.AUTOMATIC_DEPOSIT &&
            routeConfigB.AUTOMATIC_DEPOSIT
          ) {
            return 1;
          }

          // 2. Compare destination token amounts
          const destAmountA = BigInt(
            routeA.quote.destinationToken.amount.amount,
          );
          const destAmountB = BigInt(
            routeB.quote.destinationToken.amount.amount,
          );
          // Note: Sort callback return strictly expects Number
          // Returning BigInt results in TypeError
          return Number(destAmountB - destAmountA);
        });
      })
      .flat();
  }, [preferredRouteName, routesWithQuotes]);

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
      sortedRoutes,
      sortedRoutesWithQuotes,
      quotesMap,
      isFetchingSupportedRoutes,
      isFetchingQuotes,
    ],
  );
};

const bucketByEta = (
  routesWithQuotes: RouteWithQuote[],
): RouteWithQuote[][] => {
  const thresholds = [60 * 1000, Infinity];
  const buckets: RouteWithQuote[][] = [];
  for (let i = 0; i < thresholds.length; i++) {
    buckets.push([]);
  }

  for (const routeAndQuote of routesWithQuotes) {
    const { quote } = routeAndQuote;
    for (let i = 0; i < thresholds.length; i++) {
      const threshold = thresholds[i];
      const eta = quote.eta ?? Infinity;
      if (eta <= threshold) {
        buckets[i].push(routeAndQuote);
        break;
      }
    }
  }

  return buckets;
};
