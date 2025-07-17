import { Network, routes } from '@wormhole-foundation/sdk';
import { MayanRouteBase } from './MayanRouteBase';
import { MayanProtocol } from './types';

export class MayanRouteWH<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteWH>
{
  static meta = {
    name: 'MayanSwapWH',
    provider: 'Mayan',
  };

  override protocols: MayanProtocol[] = ['WH'];
}
