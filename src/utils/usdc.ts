import type { Chain, Network, TokenId } from '@wormhole-foundation/sdk';
import { Wormhole, canonicalAddress } from '@wormhole-foundation/sdk';
import { circle } from '@wormhole-foundation/sdk-base';
import { isHyperCoreChain } from './hypercore';

export function getUSDCTokenId(
  chain: Chain,
  network: Network,
): TokenId | undefined {
  if (isHyperCoreChain(chain)) {
    try {
      return Wormhole.tokenId(chain, 'native');
    } catch {
      return undefined;
    }
  }

  const usdcContract = circle.usdcContract.get(network, chain);

  if (!usdcContract) {
    return undefined;
  }

  try {
    return Wormhole.tokenId(chain, usdcContract);
  } catch {
    return undefined;
  }
}

export function isUSDCToken(
  chain: Chain,
  network: Network,
  tokenAddress: string,
): boolean {
  const usdcTokenId = getUSDCTokenId(chain, network);

  if (!usdcTokenId) {
    return false;
  }

  try {
    const candidate = Wormhole.tokenId(chain, tokenAddress);
    return canonicalAddress(candidate) === canonicalAddress(usdcTokenId);
  } catch {
    return false;
  }
}
