import type { Network } from '@wormhole-foundation/sdk-base';
import type { routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import type { MayanProtocol } from './types';

export class MayanRoute<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRoute>
{
  static meta = {
    name: 'MayanSwap',
    provider: 'Mayan',
  };

  override protocols: MayanProtocol[] = [
    'WH',
    'MCTP',
    'FAST_MCTP',
    'SWIFT',
    'MONO_CHAIN',
  ];
}
