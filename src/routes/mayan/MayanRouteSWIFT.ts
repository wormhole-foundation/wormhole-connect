import type { Network, routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import type { MayanProtocol } from './types';

export default class MayanRouteSWIFT<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteSWIFT>
{
  static meta = {
    name: 'MayanSwapSWIFT',
    provider: 'Mayan Swift',
  };

  override protocols: Array<MayanProtocol> = ['SWIFT'];
}
