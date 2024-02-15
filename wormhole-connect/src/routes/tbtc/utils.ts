import { ChainId, ChainName } from 'sdk';
import { TokenConfig } from 'config/types';
import { wh } from 'utils/sdk';

export const isTBTCCanonicalChain = (chain: ChainId | ChainName): boolean =>
  !!wh.getContracts(chain)?.tbtcGateway;

export const isTBTCToken = (token: TokenConfig): boolean =>
  token.symbol === 'tBTC';
