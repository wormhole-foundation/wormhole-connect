import {
  Chain,
  Network,
  chainToPlatform,
  routes,
} from '@wormhole-foundation/sdk';
import { MayanRouteBase } from './MayanRouteBase';
import { MayanProtocol } from './types';

export class MayanRouteMONOCHAIN<N extends Network>
  extends MayanRouteBase<N>
  implements routes.StaticRouteMethods<typeof MayanRouteMONOCHAIN>
{
  static meta = {
    name: 'MayanSwapMONOCHAIN',
    provider: 'Mayan Mono Chain',
  };

  override protocols: MayanProtocol[] = ['MONO_CHAIN'];

  static supportsSameChainSwaps(network: Network, chain: Chain) {
    const platform = chainToPlatform(chain);
    const isPlatformSupported = platform === 'Solana' || platform === 'Evm';
    return network === 'Mainnet' && isPlatformSupported;
  }
}
