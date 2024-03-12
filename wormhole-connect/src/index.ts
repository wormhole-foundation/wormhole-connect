import WormholeConnect from './WormholeConnect';
export default WormholeConnect;

export { dark, light } from './theme';
import type { CustomTheme, ExtendedTheme } from './theme';

import type { WormholeConnectConfig } from './config/types';
import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
export { WormholeConnectConfig, ChainName, CustomTheme, ExtendedTheme };

export {
  MAINNET_CHAINS,
  TESTNET_CHAINS,
  CONFIG,
} from '@wormhole-foundation/wormhole-connect-sdk';
