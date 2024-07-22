import { Route } from 'config/types';
import { routes } from '@wormhole-foundation/sdk';
import {
  nttAutomaticRoute,
  nttManualRoute,
} from '@wormhole-foundation/sdk-route-ntt';

// IMPORTANT: These imports are necessary to register the protocol layouts and implementations
import '@wormhole-foundation/sdk-definitions-ntt';
import '@wormhole-foundation/sdk-evm-ntt';
import '@wormhole-foundation/sdk-solana-ntt';
//

import { SDKv2Route } from './sdkv2/route';
import { getNttConfig } from 'utils/ntt';

export function getRoute(route: Route): SDKv2Route {
  switch (route) {
    // Migrated routes:
    case Route.Bridge:
      return new SDKv2Route(routes.TokenBridgeRoute, Route.Bridge);
    case Route.Relay:
      return new SDKv2Route(routes.AutomaticTokenBridgeRoute, Route.Relay);
    case Route.NttManual:
      return new SDKv2Route(nttManualRoute(getNttConfig()), Route.NttManual);
    case Route.NttRelay:
      return new SDKv2Route(nttAutomaticRoute(getNttConfig()), Route.NttRelay);
    default:
      throw new Error(`Unsupported route: ${route}`);
  }
}
