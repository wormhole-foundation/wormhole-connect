import type { Network } from '@wormhole-foundation/sdk-base';
import type { routes } from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import { MayanProtocol } from './types';

export class MayanRoute<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRoute>
{
  static meta = {
    name: 'MayanSwap',
    provider: 'Mayan',
  };

  override protocols: MayanProtocol[] = [
    MayanProtocol.WH,
    MayanProtocol.MCTP,
    MayanProtocol.FAST_MCTP,
    MayanProtocol.SWIFT,
    MayanProtocol.MONO_CHAIN,
  ];
}
