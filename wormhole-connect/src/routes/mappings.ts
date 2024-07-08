import { Route } from 'config/types';

// SDKv2
import { routes } from '@wormhole-foundation/sdk';
import { SDKv2Route } from './sdkv2/route';

export function getRoute(route: Route): SDKv2Route {
  switch (route) {
    // Migrated routes:
    case Route.Bridge:
      return new SDKv2Route(routes.TokenBridgeRoute, Route.Bridge);
    case Route.Relay:
      return new SDKv2Route(routes.AutomaticTokenBridgeRoute, Route.Relay);
    default:
      throw new Error(`Unsupported route: ${route}`);
  }
}
