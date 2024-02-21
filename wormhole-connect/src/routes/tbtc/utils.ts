import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import config from 'config';
import { TokenConfig } from 'config/types';

export const isTBTCCanonicalChain = (chain: ChainId | ChainName): boolean =>
  !!config.wh.getContracts(chain)?.tbtcGateway;

export const isTBTCToken = (token: TokenConfig): boolean =>
  token.symbol === 'tBTC';
