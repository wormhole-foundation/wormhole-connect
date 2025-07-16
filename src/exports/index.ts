import WormholeConnect from '../WormholeConnect';

import { type WormholeConnectTheme } from '../theme';

import MAINNET from 'config/mainnet';
import TESTNET from 'config/testnet';
import { buildConfig } from 'config';
export * as config from 'config/types';

// Routes
import { DEFAULT_ROUTES } from 'routes/operator';
import { routes } from '@wormhole-foundation/sdk';

import type { Chain } from '@wormhole-foundation/sdk';

import { Token } from 'config/tokens';

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
  Chain,
  WormholeConnectTheme,
  Token,

  // Routes
  DEFAULT_ROUTES,
  AutomaticTokenBridgeRoute,
  TokenBridgeRoute,
  AutomaticCCTPRoute,
  CCTPRoute,
};

export * from 'telemetry';
