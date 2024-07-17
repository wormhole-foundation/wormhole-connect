import '@wormhole-foundation/sdk/addresses';
import '@wormhole-foundation/sdk/platforms/evm';
import '@wormhole-foundation/sdk/platforms/solana';
import '@wormhole-foundation/sdk/platforms/aptos';
import '@wormhole-foundation/sdk/platforms/sui';
import '@wormhole-foundation/sdk/platforms/cosmwasm';
import '@wormhole-foundation/sdk/platforms/algorand';

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
};
