import { useMemo } from 'react';
import type { amount, Chain, routes } from '@wormhole-foundation/sdk';
import useFetchQuotes from 'hooks/useFetchQuotes';
import config from 'config';
import useFetchSupportedRoutes from './useFetchSupportedRoutes';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';

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
  quotes: ReturnType<typeof useFetchQuotes>['quotes'];
  failedQuotes: ReturnType<typeof useFetchQuotes>['failedQuotes'];
  isFetching: boolean;
};

interface UseSortedRoutesWithQuotesArgs {
  amount?: amount.Amount;
  fromChain?: Chain;
  toChain?: Chain;
  preferredRouteName?: string;
  toNativeToken: number;
  sourceToken?: Token;
  destToken?: Token;
  receivingWallet: WalletData;
}

export const useSortedRoutesWithQuotes = ({
  amount,
  fromChain,
  toChain,
  preferredRouteName,
  toNativeToken,
  sourceToken,
  destToken,
  receivingWallet,
}: UseSortedRoutesWithQuotesArgs): HookReturn => {
  const { supportedRoutes, isFetching: isFetchingSupportedRoutes } =
    useFetchSupportedRoutes({
      fromChain,
      toChain,
      sourceToken,
      destToken,
      toNativeToken,
      receivingWallet,
    });

  const quoteParams = useMemo(
    () => ({
      amount,
      sourceChain: fromChain,
      sourceToken,
      destChain: toChain,
      destToken,
      nativeGas: toNativeToken,
      recipient: receivingWallet?.address,
    }),
    [
      amount,
      fromChain,
      sourceToken,
      destToken,
      toChain,
      toNativeToken,
      receivingWallet?.address,
    ],
  );

  const {
    quotes,
    failedQuotes,
    isFetchingInitialQuotes: isFetchingQuotes,
  } = useFetchQuotes(supportedRoutes, quoteParams);

  const routesWithQuotes = useMemo(() => {
    return supportedRoutes
      .map((route) => {
        const quote = quotes[route];
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
  }, [supportedRoutes, quotes]);

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
      quotes,
      failedQuotes,
      isFetching: isFetchingSupportedRoutes || isFetchingQuotes,
    }),
    [
      supportedRoutes,
      sortedRoutes,
      sortedRoutesWithQuotes,
      quotes,
      failedQuotes,
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
