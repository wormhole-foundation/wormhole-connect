import type { routes } from '@wormhole-foundation/sdk';

export function getSlippageFromQuote(
  quote: routes.QuoteResult<routes.Options> | undefined,
) {
  if (!quote || !quote.success) {
    return undefined;
  }
  return quote.details?.slippageBps;
}

export function getMinReceivedFromQuote(
  quote: routes.QuoteResult<routes.Options> | undefined,
) {
  if (!quote || !quote.success) {
    return undefined;
  }
  return quote.details?.minReceived;
}
