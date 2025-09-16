import type { routes } from '@wormhole-foundation/sdk-connect';
import type { Network } from '@wormhole-foundation/sdk-base';
import type { MayanProtocol } from './types';
import { MayanRouteBase } from './MayanRouteBase';

export class MayanRouteFastMCTP<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteFastMCTP>
{
  static meta = {
    name: 'MayanSwapFastMCTP',
    provider: 'Mayan Fast MCTP',
  };

  override protocols: MayanProtocol[] = ['FAST_MCTP'];
}
