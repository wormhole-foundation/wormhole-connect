import { routes } from '@wormhole-foundation/sdk';

import '@wormhole-foundation/sdk-definitions-ntt';
import '@wormhole-foundation/sdk-evm-ntt';
import '@wormhole-foundation/sdk-solana-ntt';

import {
  nttAutomaticRoute,
  type NttExecutorRoute,
  nttExecutorRoute,
  nttManualRoute,
  NttRoute,
} from '@wormhole-foundation/sdk-route-ntt';

// Convenience function for integrators when adding NTT routes to their config
//
// Example:
//
// routes: [
//   ...DEFAULT_ROUTES,
//   ...nttRoutes({ ... }),
// ]
const nttRoutes = (
  nc: NttRoute.Config,
  executorOptions?: Omit<NttExecutorRoute.Config, 'ntt'>,
): routes.RouteConstructor[] => {
  return [
    nttManualRoute(nc) as routes.RouteConstructor,
    nttAutomaticRoute(nc) as routes.RouteConstructor,
    nttExecutorRoute({
      ntt: nc,
      ...executorOptions,
    }) as routes.RouteConstructor,
  ];
};

export { nttAutomaticRoute, nttExecutorRoute, nttManualRoute, nttRoutes };
