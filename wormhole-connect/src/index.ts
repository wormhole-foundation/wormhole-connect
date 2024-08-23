import WormholeConnect from './WormholeConnect';

import type {
  WormholeConnectPartialTheme,
  WormholeConnectTheme,
} from './theme';

import { dark, light } from './theme';

import MAINNET from './config/mainnet';
import TESTNET from './config/testnet';

import { DEFAULT_ROUTES, nttRoutes } from './routes/operator';

import type { WormholeConnectConfig } from './config/types';
import type { WormholeConnectEvent } from './telemetry/types';
import type { Chain, routes } from '@wormhole-foundation/sdk';

export default WormholeConnect;

export {
  MAINNET,
  TESTNET,
  WormholeConnectConfig,
  Chain,
  dark,
  light,
  DEFAULT_ROUTES,
  nttRoutes,
  routes,
  WormholeConnectPartialTheme,
  WormholeConnectTheme,
  WormholeConnectEvent,
};
