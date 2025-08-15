import { type Network, type routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import type { MayanProtocol } from './types';

export default class MayanRouteMCTP<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteMCTP>
{
  static meta = {
    name: 'MayanSwapMCTP',
    provider: 'Mayan MCTP',
  };

  override protocols: MayanProtocol[] = ['MCTP'];
}
