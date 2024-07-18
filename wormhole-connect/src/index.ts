import WormholeConnect from './WormholeConnect';

import type {
  WormholeConnectPartialTheme,
  WormholeConnectTheme,
} from './theme';

import { dark, light } from './theme';

import MAINNET from './config/mainnet';
import TESTNET from './config/testnet';

import type { WormholeConnectConfig } from './config/types';
import type { ChainName } from 'sdklegacy';
import type { WormholeConnectEvent } from './telemetry/types'

export default WormholeConnect;

export {
  MAINNET,
  TESTNET,
  WormholeConnectConfig,
  ChainName,
  dark,
  light,
  WormholeConnectPartialTheme,
  WormholeConnectTheme,
  WormholeConnectEvent,
};
