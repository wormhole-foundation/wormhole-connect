import type { routes } from '@wormhole-foundation/sdk';

export const getSlippageFromQuote = (
  quote: routes.QuoteResult<routes.Options> | undefined,
) => {
  if (!quote || !quote.success) {
    return undefined;
  }
  return quote.details?.slippageBps;
};

export const getMinReceivedFromQuote = (
  quote: routes.QuoteResult<routes.Options> | undefined,
) => {
  if (!quote || !quote.success) {
    return undefined;
  }
  return quote?.details?.minReceived;
};
