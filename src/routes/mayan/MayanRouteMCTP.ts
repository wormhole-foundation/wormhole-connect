import { Network, routes } from '@wormhole-foundation/sdk';
import { MayanRouteBase } from './MayanRouteBase';
import { MayanProtocol } from './types';

export class MayanRouteMCTP<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteMCTP>
{
  static meta = {
    name: 'MayanSwapMCTP',
    provider: 'Mayan MCTP',
  };

  override protocols: MayanProtocol[] = ['MCTP'];
}
