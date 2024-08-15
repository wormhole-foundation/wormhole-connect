import { Route } from 'config/types';
import { routes } from '@wormhole-foundation/sdk';
import {
  nttAutomaticRoute,
  nttManualRoute,
} from '@wormhole-foundation/sdk-route-ntt';
import { MayanRoute } from '@mayanfinance/wormhole-sdk-route';

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
      return new SDKv2Route(routes.TokenBridgeRoute, route);
    case Route.Relay:
      return new SDKv2Route(routes.AutomaticTokenBridgeRoute, route);
    case Route.CCTPManual:
      return new SDKv2Route(routes.CCTPRoute, route);
    case Route.CCTPRelay:
      return new SDKv2Route(routes.AutomaticCCTPRoute, route);
    case Route.NttManual:
      /* @ts-ignore TODO remove */
      return new SDKv2Route(nttManualRoute(getNttConfig()), route);
    case Route.NttRelay:
      /* @ts-ignore TODO remove */
      return new SDKv2Route(nttAutomaticRoute(getNttConfig()), route);
    case Route.Mayan:
      return new SDKv2Route(MayanRoute, route);
    default:
      throw new Error(`Unsupported route: ${route}`);
  }
}
