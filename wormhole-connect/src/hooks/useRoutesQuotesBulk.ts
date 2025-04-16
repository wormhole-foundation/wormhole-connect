import { isSameToken, amount as sdkAmount } from '@wormhole-foundation/sdk';
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
import { Token } from 'config/tokens';
import { useTokens } from 'contexts/TokensContext';

type Params = {
  sourceChain?: Chain;
  sourceToken: Token | undefined;
  destChain?: Chain;
  destToken: Token | undefined;
  amount?: sdkAmount.Amount;
  nativeGas: number;
};

export type QuoteAndStatus = {
  quote: QuoteResult;
  isRefreshing: boolean;
};

type HookReturn = {
  quotesMap: Record<string, QuoteResult | undefined>;
  isFetchingInitialQuotes: boolean;
};

const MAYAN_BETA_PROTOCOL_LIMITS = {
  MCTP: 10_000,
  SHUTTLE: 5000,
};

const useRoutesQuotesBulk = (routes: string[], params: Params): HookReturn => {
  const [nonce, setNonce] = useState(new Date().valueOf());
  const [refreshTimeout, setRefreshTimeout] = useState<null | ReturnType<
    typeof setTimeout
  >>(null);

  const [isFetchingInitialQuotes, setIsFetchingInitialQuotes] = useState(false);
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
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
  const usdValue = calculateUSDPriceRaw(
    getTokenPrice,
    params.amount,
    params.sourceToken,
  );

  useEffect(() => {
    if (routes.length === 0) return;

    // Determine when the next quote expires, and set a timer
    // to refetch quotes at that point.
    let timeTilNextFetch = 0;

    if (quotes.length > 0) {
      const rParams = params as Required<QuoteParams>;
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
      clearTimeout(refreshTimeout);
    }

    console.debug(
      `Waiting ${timeTilNextFetch / 1000}s until next quote fetch`,
      routes,
      params,
    );

    const _refreshTimeout = setTimeout(
      () => setNonce(new Date().valueOf()),
      timeTilNextFetch,
    );
    setRefreshTimeout(_refreshTimeout);

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [quotes]);

  useEffect(() => {
    let unmounted = false;
    if (
      !params.sourceChain ||
      !params.sourceToken ||
      !params.destChain ||
      !params.destToken ||
      !params.amount ||
      routes.length === 0 ||
      !isVisible
    ) {
      return;
    }

    // Forcing TS to infer that fields are non-optional
    const rParams = params as Required<QuoteParams>;

    if (isTransactionInProgress) {
      // Don't fetch new quotes if the user has committed to one and has initiated a transaction
    } else {
      const quotesValues = quotes.filter((q) => q.success);
      // Immediately invalidate quotes if token inputs changed
      if (quotesValues.length > 0) {
        const { sourceToken, destinationToken } = quotesValues[0];
        if (
          !isSameToken(sourceToken.token, rParams.sourceToken) ||
          !isSameToken(destinationToken.token, rParams.destToken)
        ) {
          setIsFetchingInitialQuotes(true);
          setQuotes([]);
        }
      }

      config.routes.getQuotes(routes, rParams).then((quoteResults) => {
        if (!unmounted) {
          setQuotes(quoteResults);
          setIsFetchingInitialQuotes(false);
        }
      });
    }

    return () => {
      unmounted = true;
    };
    // Important: We should not include routes property in deps. See routes.join() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    routes.join(), // .join() is necessary to prevent unnecessary updates when routes array's ref changed but its content did not
    params.sourceChain,
    params.sourceToken,
    params.destChain,
    params.destToken,
    params.amount,
    params.nativeGas,
    nonce,
    isTransactionInProgress,
    params,
    isFetchingInitialQuotes,
    isVisible,
  ]);

  const quotesMap = useMemo(
    () =>
      routes.reduce((acc, route, index) => {
        acc[route] = quotes[index];
        return acc;
      }, {} as Record<string, QuoteResult | undefined>),
    // Important: We should not include routes property in deps. See routes.join() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      routes.join(), // .join() is necessary to prevent unnecessary updates when routes array's ref changed but its content did not
      quotes,
    ],
  );

  // Filter out quotes that would result in a large instant loss
  // (Transfers >=$1000 with >=10% value loss)
  for (const name in quotesMap) {
    const quote = quotesMap[name];
    if (quote !== undefined && quote.success) {
      const usdValueOut = calculateUSDPriceRaw(
        getTokenPrice,
        quote.destinationToken.amount,
        params.destToken,
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
          quotesMap[name] = {
            success: false,
            error: new Error(`Amount exceeds limit of $${protocolLimit} USD`),
          };
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
    isFetchingInitialQuotes,
  };
};

export default useRoutesQuotesBulk;
