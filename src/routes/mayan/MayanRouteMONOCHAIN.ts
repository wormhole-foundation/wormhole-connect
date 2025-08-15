import {
  chainToPlatform,
  type Chain,
  type Network,
  type routes,
} from '@wormhole-foundation/sdk-connect';
import { MayanRouteBase } from './MayanRouteBase';
import type { MayanProtocol } from './types';

export default class MayanRouteMONOCHAIN<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteMONOCHAIN>
{
  static meta = {
    name: 'MayanSwapMONOCHAIN',
    provider: 'Mayan Mono Chain',
  };

  override protocols: Array<MayanProtocol> = ['MONO_CHAIN'];

  static supportsSameChainSwaps(network: Network, chain: Chain) {
    const platform = chainToPlatform(chain);
    const isPlatformSupported = platform === 'Solana' || platform === 'Evm';
    return network === 'Mainnet' && isPlatformSupported;
  }
}
