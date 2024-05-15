import { Route } from 'config/types';

import { routes } from '@wormhole-foundation/sdk';
import { RouteAbstract } from './abstracts/routeAbstract';

// Legacy routes
import { BridgeRoute } from './bridge';
import { RelayRoute } from './relay';
import { CCTPRelayRoute } from './cctpRelay';
import { CCTPManualRoute } from './cctpManual';
import { TBTCRoute } from './tbtc';
import { ETHBridge } from './porticoBridge/ethBridge';
import { wstETHBridge } from './porticoBridge/wstETHBridge';
import { CosmosGatewayRoute } from './cosmosGateway';
import { NttManual, NttRelay } from './ntt';

export interface RouteImpls {
  v1: RouteAbstract;
  v2?: routes.RouteConstructor;
}

export const ROUTE_MAPPINGS: Record<Route, RouteImpls> = {
  [Route.Bridge]: {
    v1: new BridgeRoute(),
    v2: routes.TokenBridgeRoute,
  },
  [Route.Relay]: {
    v1: new RelayRoute(),
    v2: routes.AutomaticTokenBridgeRoute,
  },
  [Route.CCTPManual]: {
    v1: new CCTPManualRoute(),
    v2: routes.CCTPRoute,
  },
  [Route.CCTPRelay]: {
    v1: new CCTPRelayRoute(),
    v2: routes.AutomaticCCTPRoute,
  },
  [Route.CosmosGateway]: {
    v1: new CosmosGatewayRoute(),
  },
  [Route.TBTC]: {
    v1: new TBTCRoute(),
  },
  [Route.ETHBridge]: {
    v1: new ETHBridge(),
    v2: routes.AutomaticPorticoRoute,
  },
  [Route.wstETHBridge]: {
    v1: new wstETHBridge(),
    v2: routes.AutomaticPorticoRoute,
  },
  [Route.NttManual]: {
    v1: new NttManual(),
  },
  [Route.NttRelay]: {
    v1: new NttRelay(),
  },
};
