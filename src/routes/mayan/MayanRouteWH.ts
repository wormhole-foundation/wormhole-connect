import type { Network, routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import type { MayanProtocol } from './types';

export default class MayanRouteWH<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteWH>
{
  static meta = {
    name: 'MayanSwapWH',
    provider: 'Mayan',
  };

  override protocols: Array<MayanProtocol> = ['WH'];
}
