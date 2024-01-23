import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import { wh } from 'utils/sdk';

export const isTBTCCanonicalChain = (chain: ChainId | ChainName): boolean =>
  !!wh.getContracts(chain)?.tbtcGateway;

export const isTBTCToken = (token: TokenConfig): boolean =>
  token.symbol === 'tBTC';
