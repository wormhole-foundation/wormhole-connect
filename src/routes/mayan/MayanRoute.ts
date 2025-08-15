import type { Network, routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import type { MayanProtocol } from './types';

export default class MayanRoute<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRoute>
{
  static meta = {
    name: 'MayanSwap',
    provider: 'Mayan',
  };

  override protocols: Array<MayanProtocol> = [
    'WH',
    'MCTP',
    'SWIFT',
    'MONO_CHAIN',
  ];
}
