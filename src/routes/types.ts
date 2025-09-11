import type { routes, Network } from '@wormhole-foundation/sdk';

export type QuoteMetadata = {
  router: routes.Route<Network>;
  quote: routes.QuoteResult<routes.Options>;
  request: routes.RouteTransferRequest<Network>;
};
