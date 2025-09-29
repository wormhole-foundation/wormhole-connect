import type { Chain } from '@wormhole-foundation/sdk';
import { chainToPlatform } from '@wormhole-foundation/sdk';

export function isEvmChain(chain: Chain): boolean {
  return chainToPlatform.has(chain) && chainToPlatform.get(chain) === 'Evm';
}
