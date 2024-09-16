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

const MAYAN_BETA_LIMIT = 10_000; // USD
const MAYAN_BETA_PROTOCOLS = ['MCTP', 'SWIFT'];

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
        // 1) Disallow transfers >$1000 (temporary, while in beta)
        // 2) For transfers <=$1000, calculate network costs manually, because Mayan API doesn't
        //    expose relayer fee info for Swift quotes.
        //
        // TODO all of the code here is horrible and would ideally not exist

        if (usdAmount !== undefined && usdAmount > MAYAN_BETA_LIMIT) {
          // Temporarily disallow Swift quotes above $1000
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
            tokenConfig,
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
