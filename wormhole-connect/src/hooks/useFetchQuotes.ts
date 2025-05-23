import { isSameToken, amount as sdkAmount } from '@wormhole-foundation/sdk';
import { useState, useEffect, useRef, useMemo } from 'react';
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
import { Token } from 'config/tokens';
import { useTokens } from 'contexts/TokensContext';

type Params = {
  sourceChain?: Chain;
  sourceToken: Token | undefined;
  destChain?: Chain;
  destToken: Token | undefined;
  amount?: sdkAmount.Amount;
  nativeGas: number;
  recipient?: string;
};

type HookReturn = {
  quotes: Record<string, QuoteResult | undefined>;
  isFetchingInitialQuotes: boolean;
};

const MAYAN_BETA_PROTOCOL_LIMITS = {
  SHUTTLE: 10_000,
};

export default (routes: string[], params: Params): HookReturn => {
  const [nonce, setNonce] = useState(new Date().valueOf());
  const refreshTimeout = useRef<undefined | ReturnType<typeof setTimeout>>(
    undefined,
  );
  const [isFetchingInitialQuotes, setIsFetchingInitialQuotes] = useState(false);
  const [unfilteredQuotes, setUnfilteredQuotes] = useState<
    Record<string, QuoteResult>
  >({});
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const visibilityHandler = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  // TODO temporary
  // Calculate USD amount for temporary $10,000 Mayan limit
  const { getTokenPrice } = useTokens();
  const { isTransactionInProgress } = useSelector(
    (state: RootState) => state.transferInput,
  );

  useEffect(() => {
    if (routes.length === 0) return;

    // Determine when the next quote expires, and set a timer
    // to refetch quotes at that point.
    let timeTilNextFetch = 0;

    if (Object.keys(unfilteredQuotes).length > 0) {
      const rParams = params as Required<QuoteParams>;

      if (
        !rParams.amount ||
        !rParams.sourceToken ||
        !rParams.destToken ||
        !rParams.sourceChain ||
        !rParams.destChain
      ) {
        // Stop fetching if no amount entered
        return;
      }

      const nextExpiry = config.routes.quoteCache.nextExpiry(routes, rParams);

      if (!nextExpiry) {
        return;
      }
      // Fetch again 5 seconds before the next expiry
      timeTilNextFetch = nextExpiry.valueOf() - Date.now() - 5_000;
    }

    if (!timeTilNextFetch) {
      return;
    }

    if (refreshTimeout) {
      clearTimeout(refreshTimeout.current);
    }

    console.debug(
      `Waiting ${timeTilNextFetch / 1000}s until next quote fetch`,
      routes,
      params,
    );

    refreshTimeout.current = setTimeout(
      () => setNonce(Date.now()),
      timeTilNextFetch,
    );

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, [unfilteredQuotes, routes, params]);

  // IMPORTANT
  //
  // This is the hook where the quotes are actually fetched. This should only be invoked by
  // very specific events:
  //
  // 1. supported routes being recomputed (this is the "routes" dep)
  // 2. the expiry watching hook above has fired because one of our quotes expired (this is the "nonce" dep)
  // 3. the user changed the amount input (this is the "params.amount" dep)
  // 3. the user changed the gas dropoff input (this is the "params.nativeGas" dep)
  // 4. the tab became visible again after being not visible (this is the "isVisible" dep)
  //
  // Notably we are NOT putting all of "params" into the deps, or any of its other properties, which
  // are the tokens or chains. We do not want to immediately fetch quotes when the user changes the
  // chain or token because we don't have a new list of supported routes for those inputs yet.
  // This is why "routes" is a dependency here. This input is recomputed by useFetchSupportedRoutes inside of
  // useSortedRoutesWithQuotes, which is also the parent hook which invokes this fetchQuotes hook.
  //
  // In other words it is a pipeline; we need to first figure out which routes are supported before
  // we fetch quotes.
  //
  // So please don't add deps to this hook just because the linter told you to, or if you don't understand
  // how all of this is supposed to flow. React hooks are an inelegant tool for building pipelines and lead
  // you to writing confusing spaghetti, but this is what we have to work with.
  useEffect(() => {
    let unmounted = false;
    const cleanup = () => {
      unmounted = true;
    };

    if (
      routes.length === 0 ||
      !params.sourceChain ||
      !params.sourceToken ||
      !params.destChain ||
      !params.destToken ||
      !params.amount
    ) {
      // Clear quotes if we are missing any inputs or if the inputs support 0 routes
      setUnfilteredQuotes({});
      setIsFetchingInitialQuotes(false);
      return cleanup;
    }

    if (isTransactionInProgress || !isVisible) {
      // Leave quotes alone if the user initiated a transfer,
      // or if the tab is not visible.
      return cleanup;
    }

    // Forcing TS to infer that fields are non-optional
    const rParams = params as Required<QuoteParams>;

    const quotesValues = Object.values(unfilteredQuotes).filter(
      (q) => q.success,
    );
    // Immediately invalidate quotes if token inputs changed
    if (quotesValues.length > 0) {
      const { sourceToken, destinationToken } = quotesValues[0];
      if (
        !isSameToken(sourceToken.token, rParams.sourceToken) ||
        !isSameToken(destinationToken.token, rParams.destToken)
      ) {
        setUnfilteredQuotes({});
      }
    }

    // Let the hook caller know when we are fetching for the first time
    // so it can show an in-progress state.
    //
    // However, when fetching updates afterwards, we do not need to show
    // this in-progress state because there are already existing quotes
    // to show - this is less jarring.
    if (Object.keys(unfilteredQuotes).length === 0 && routes.length !== 0) {
      setIsFetchingInitialQuotes(true);
    }

    config.routes.getQuotes(routes, rParams).then((quoteResults) => {
      if (!unmounted) {
        setUnfilteredQuotes(quoteResults);
        setIsFetchingInitialQuotes(false);
      }
    });

    return cleanup;
    // Important: Do not the token or chain params to the dependency array. This causes the hook
    // to fire prematurely; we need to figure out supported routes before fetching quotes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    routes,
    nonce,
    params.amount,
    params.nativeGas,
    params.recipient,
    isVisible,
  ]);

  const quotes = useMemo(() => {
    const usdValue = calculateUSDPriceRaw(
      getTokenPrice,
      params.amount,
      params.sourceToken,
    );

    let filtered = Object.assign({}, unfilteredQuotes);

    // Filter out quotes that would result in a large instant loss
    // (Transfers >=$1000 with >=10% value loss)
    //
    // OR if both tokens have the same symbol and we fail to fetch a USD for either of them
    // we assume they are the same token and just compare the token amounts.
    for (const name in filtered) {
      const quote = filtered[name];

      if (quote !== undefined && quote.success) {
        const usdValueOut = calculateUSDPriceRaw(
          getTokenPrice,
          quote.destinationToken.amount,
          params.destToken,
        );

        if (usdValue !== undefined && usdValueOut !== undefined) {
          const valueRatio = usdValueOut / usdValue;
          if (usdValue >= 1000 && valueRatio <= 0.9) {
            // Don't offer quotes where the USD value out delta exceeds a $1,000 or 10% loss
            console.debug(
              `Filtering out ${name} quote with valueRatio=${valueRatio} USD delta=${
                usdValue - usdValueOut
              }`,
            );
            delete filtered[name];
          }
        } else if (
          params.amount &&
          params.sourceToken &&
          params.destToken &&
          params.sourceToken.symbol === params.destToken.symbol
        ) {
          const valueRatio =
            parseFloat(amount.display(quote.destinationToken.amount)) /
            parseFloat(amount.display(params.amount));

          if (valueRatio <= 0.9) {
            console.debug(
              `Filtering out ${name} quote with valueRatio=${valueRatio} (for same-symbol tokens)`,
            );
            delete filtered[name];
          }
        }
      }
    }

    // TODO temporary logic for beta Mayan support
    for (const name in filtered) {
      if (name.startsWith('MayanSwap')) {
        const mayanQuote = filtered[name];

        if (mayanQuote !== undefined && mayanQuote.success) {
          // There are two special cases here for Mayan Swift transfers
          //
          // 1) Apply limits for the specified protocols, see MAYAN_BETA_PROTOCOL_LIMITS (temporary, while in beta).
          // 2) For transfers <=$10,000, calculate network costs manually, because Mayan API doesn't
          //    expose relayer fee info for Swift quotes.
          //
          // TODO all of the code here is horrible and would ideally not exist

          const protocolLimit =
            MAYAN_BETA_PROTOCOL_LIMITS[mayanQuote.details?.type.toUpperCase()];

          if (
            protocolLimit &&
            usdValue !== undefined &&
            usdValue > protocolLimit
          ) {
            // Temporarily disallow quotes above the limit
            // TODO revisit this
            delete filtered[name];
            console.warn(
              `Filtering out ${name} quote which exceeds $${protocolLimit} USD`,
            );
          } else {
            const approxInputUsdValue = calculateUSDPriceRaw(
              getTokenPrice,
              params.amount,
              params.sourceToken,
            );
            const approxOutputUsdValue = calculateUSDPriceRaw(
              getTokenPrice,
              mayanQuote.destinationToken.amount,
              params.destToken,
            );

            if (approxInputUsdValue && approxOutputUsdValue) {
              const approxUsdNetworkCost =
                approxInputUsdValue - approxOutputUsdValue;

              if (!isNaN(approxUsdNetworkCost) && approxUsdNetworkCost > 0) {
                (filtered[name] as routes.Quote<Network>).relayFee = {
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

    // Hide manual quotes if the integrator has set config.ui.onlyOfferManualRoutesAsFallback to true
    if (config.ui.onlyOfferManualRoutesAsFallback) {
      let hasAutomaticQuote = false;
      const onlyAutomaticQuotes = {};
      for (const name in filtered) {
        const quote = filtered[name];
        const route = config.routes.get(name);
        if (route.AUTOMATIC_DEPOSIT) {
          hasAutomaticQuote = true;
          onlyAutomaticQuotes[name] = quote;
        }
      }

      if (hasAutomaticQuote) {
        filtered = onlyAutomaticQuotes;
      }
    }

    // Apply arbitrary routes filter if provided in the config
    if (typeof config.filterRoutes === 'function') {
      // Only include routes with a successful quote when passing route names into filterRoutes
      // (We keep unsuccessful quotes around for other purposes)
      const routeNames = Object.entries(filtered)
        .filter(([_, quote]) => quote.success)
        .map(([routeName, _]) => routeName);

      try {
        const filteredRoutes = config.filterRoutes([...routeNames]);
        // Ensure the filtered routes are valid route names
        // and included in the original supported routes.
        if (
          Array.isArray(filteredRoutes) &&
          filteredRoutes.every(
            (r) => typeof r === 'string' && routeNames.includes(r),
          )
        ) {
          // Delete quotes not in the list of route names returned by config.filterRoutes
          for (const key in filtered) {
            if (!filteredRoutes.includes(key)) {
              delete filtered[key];
            }
          }
        } else {
          console.warn(
            'config.filterRoutes returned one or more invalid route names',
            filteredRoutes,
            'Falling back to all supported routes',
            routeNames,
          );
        }
      } catch (e) {
        console.warn(
          'Error when filtering routes',
          e,
          'Falling back to all supported routes',
          routeNames,
        );
      }
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unfilteredQuotes]);

  return {
    quotes,
    isFetchingInitialQuotes,
  };
};
