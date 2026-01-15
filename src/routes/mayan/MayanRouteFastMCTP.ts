import type { routes } from '@wormhole-foundation/sdk-connect';
import type { Network } from '@wormhole-foundation/sdk-base';
import { MayanProtocol } from './types';
import { MayanRouteCrossChain } from './MayanRouteCrossChain';

export class MayanRouteFastMCTP<N extends Network>
  extends MayanRouteCrossChain<N>
  implements routes.StaticRouteMethods<typeof MayanRouteFastMCTP>
{
  static meta = {
    name: 'MayanSwapFastMCTP',
    provider: 'Mayan MCTP',
  };

  override protocols: MayanProtocol[] = [MayanProtocol.FAST_MCTP];
}
