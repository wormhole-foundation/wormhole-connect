import { Network, routes } from '@wormhole-foundation/sdk';
import { MayanRouteBase } from './MayanRouteBase';
import { MayanProtocol } from './types';

export class MayanRouteSWIFT<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteSWIFT>
{
  static meta = {
    name: 'MayanSwapSWIFT',
    provider: 'Mayan Swift',
  };

  override protocols: MayanProtocol[] = ['SWIFT'];
}
