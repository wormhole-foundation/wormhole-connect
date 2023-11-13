import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from 'utils/sdk';

export const isTBTCCanonicalChain = (chain: ChainId | ChainName): boolean =>
  !!wh.getContracts(chain)?.tbtcGateway;
