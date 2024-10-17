import WormholeConnect from './WormholeConnect';

import type { WormholeConnectTheme } from './theme';

import MAINNET from './config/mainnet';
import TESTNET from './config/testnet';
import { buildConfig } from './config';
import type { WormholeConnectConfig } from './config/types';
import type { WormholeConnectEvent } from './telemetry/types';

// Routes
import { DEFAULT_ROUTES, nttRoutes } from './routes/operator';
import { routes } from '@wormhole-foundation/sdk';
import {
  MayanRoute,
  MayanRouteWH,
  MayanRouteMCTP,
  MayanRouteSWIFT,
} from '@mayanfinance/wormhole-sdk-route';
import {
  nttAutomaticRoute,
  nttManualRoute,
} from '@wormhole-foundation/sdk-route-ntt';

import type { Chain } from '@wormhole-foundation/sdk';

import { wormholeConnectHosted } from './hosted';
import type { HostedParameters } from './hosted';

const {
  AutomaticTokenBridgeRoute,
  TokenBridgeRoute,
  AutomaticCCTPRoute,
  CCTPRoute,
  AutomaticPorticoRoute,
} = routes;

export default WormholeConnect;

export {
  // Config related exports
  MAINNET,
  TESTNET,
  buildConfig,

  // Types
  WormholeConnectConfig,
  Chain,
  WormholeConnectTheme,
  WormholeConnectEvent,

  // Routes
  DEFAULT_ROUTES,
  nttRoutes,
  nttAutomaticRoute,
  nttManualRoute,
  AutomaticTokenBridgeRoute,
  TokenBridgeRoute,
  AutomaticCCTPRoute,
  CCTPRoute,
  AutomaticPorticoRoute,
  MayanRoute,
  MayanRouteWH,
  MayanRouteMCTP,
  MayanRouteSWIFT,

  // Utility function for CDN-hosted version of Connect
  wormholeConnectHosted,
  HostedParameters,
};
