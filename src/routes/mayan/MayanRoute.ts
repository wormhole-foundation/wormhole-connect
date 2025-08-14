import type { Network, routes } from '@wormhole-foundation/sdk-connect';

export class MayanRoute<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRoute>
{
  static meta = {
    name: 'MayanSwap',
    provider: 'Mayan',
  };

  override protocols: MayanProtocol[] = ['WH', 'MCTP', 'SWIFT', 'MONO_CHAIN'];
}
