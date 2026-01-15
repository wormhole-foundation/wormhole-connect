import type { Network } from '@wormhole-foundation/sdk-base';
import type { routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteCrossChain } from './MayanRouteCrossChain';
import { MayanProtocol } from './types';

export class MayanRouteWH<N extends Network>
  extends MayanRouteCrossChain<N>
  implements routes.StaticRouteMethods<typeof MayanRouteWH>
{
  static meta = {
    name: 'MayanSwapWH',
    provider: 'Mayan WH',
  };

  override protocols: MayanProtocol[] = [MayanProtocol.WH];
}
