import { Connection, Commitment, PublicKeyInitData } from '@solana/web3.js';
import {
  deriveTokenBridgeConfigKey,
  getTokenBridgeConfig,
  TokenBridgeConfig,
} from '../../tokenBridge';
export const deriveNftBridgeConfigKey = deriveTokenBridgeConfigKey;
export class NftBridgeConfig extends TokenBridgeConfig {}
