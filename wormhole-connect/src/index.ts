import WormholeConnect from './WormholeConnect';

import type { WormholeConnectTheme } from './theme';

import { dark, light } from './theme';

import MAINNET from './config/mainnet';
import TESTNET from './config/testnet';
import { buildConfig } from './config';
import type { WormholeConnectConfig } from './config/types';

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
  dark,
  light,

  // Routes
  DEFAULT_ROUTES,
  nttRoutes,
  nttAutomaticRoute,
  nttManualRoute,
  AutomaticTokenBridgeRoute,
  TokenBridgeRoute,
  AutomaticCCTPRoute,
  CCTPRoute,
  MayanRoute,
  MayanRouteWH,
  MayanRouteMCTP,
  MayanRouteSWIFT,

  // Utility function for CDN-hosted version of Connect
  wormholeConnectHosted,
  HostedParameters,
};
