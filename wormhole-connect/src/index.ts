import WormholeConnect from './WormholeConnect';

import type {
  WormholeConnectPartialTheme,
  WormholeConnectTheme,
} from './theme';

import { dark, light } from './theme';

import MAINNET from './config/mainnet';
import TESTNET from './config/testnet';

// Routes
import { DEFAULT_ROUTES, nttRoutes } from './routes/operator';
import { routes } from '@wormhole-foundation/sdk';
import { MayanRoute } from '@mayanfinance/wormhole-sdk-route';
import {
  nttAutomaticRoute,
  nttManualRoute,
} from '@wormhole-foundation/sdk-route-ntt';

import type { WormholeConnectConfig } from './config/types';
import type { Chain } from '@wormhole-foundation/sdk';

const {
  AutomaticTokenBridgeRoute,
  TokenBridgeRoute,
  AutomaticCCTPRoute,
  CCTPRoute,
} = routes;

export default WormholeConnect;

export {
  MAINNET,
  TESTNET,

  // Types
  WormholeConnectConfig,
  Chain,
  WormholeConnectPartialTheme,
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
};
