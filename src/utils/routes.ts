import config from 'config';

import type { routes } from '@wormhole-foundation/sdk';

export const getBestRoutes = (
  routes: string[],
  quotes: Record<string, routes.QuoteResult<routes.Options> | undefined>,
): {
  fastestRoute: { name: string; eta: number };
  cheapestRoute: { name: string; amountOut: bigint };
} => {
  let fastestRoute = { name: '', eta: Infinity };
  let cheapestRoute = { name: '', amountOut: 0n };

  for (const route of routes) {
    const quote = quotes[route];
    if (!quote || !quote.success) {
      continue;
    }

    // Check if fastest
    if (quote.eta !== undefined && quote.eta < fastestRoute.eta) {
      fastestRoute = { name: route, eta: quote.eta };
    }

    // Check if cheapest
    const rc = config.routes.get(route);
    if (rc?.AUTOMATIC_DEPOSIT) {
      const amountOut = BigInt(quote.destinationToken.amount.amount);
      if (amountOut > cheapestRoute.amountOut) {
        cheapestRoute = { name: route, amountOut };
      }
    }
  }

  return { fastestRoute, cheapestRoute };
};

export function getDefaultQuoteExpiry(fromDate: number) {
  return new Date(fromDate + 30_000);
}

export function getQuoteExpiry(expiryFromQuote?: Date) {
  const now = Date.now();

  // A valid expiry should be at least 5 seconds in the future
  // If not, we should default it to 30 seconds.
  const isValidExpiry =
    expiryFromQuote instanceof Date && expiryFromQuote.getTime() > now + 5_000;

  if (!isValidExpiry) {
    return getDefaultQuoteExpiry(now);
  }

  return expiryFromQuote;
}
