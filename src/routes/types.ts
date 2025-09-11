import type { routes, Network } from '@wormhole-foundation/sdk';

export type QuoteMetadata = {
  quote: routes.QuoteResult<routes.Options>;
  request: routes.RouteTransferRequest<Network>;
  routeInstance: routes.Route<Network>;
};
