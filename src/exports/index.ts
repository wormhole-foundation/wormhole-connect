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
import { TransferWallet } from 'utils/wallet';
import type {
  Wallet,
  WalletConnectedHandler,
  WalletEvents,
  WalletProviderEvents,
  WormholeConnectWalletProvider,
} from 'utils/wallet/types';

const {
  AutomaticTokenBridgeRoute,
  TokenBridgeRoute,
  AutomaticCCTPRoute,
  CCTPRoute,
  TBTCRoute,
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

  // Wallet related exports
  TransferWallet,
  Wallet,
  WalletEvents,
  WormholeConnectWalletProvider,
  WalletProviderEvents,
  WalletConnectedHandler,

  // Routes
  DEFAULT_ROUTES,
  AutomaticTokenBridgeRoute,
  TokenBridgeRoute,
  AutomaticCCTPRoute,
  CCTPRoute,
  TBTCRoute,
};

export * from 'telemetry';
