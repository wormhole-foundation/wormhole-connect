import type { Chain, Network, TokenAddress } from '@wormhole-foundation/sdk';
import { chainToPlatform, isNative } from '@wormhole-foundation/sdk';
import { WETH_CONTRACTS } from '@wormhole-foundation/sdk-evm';

const WSOL_ADDRESS = 'So11111111111111111111111111111111111111112';

export function getWrappedNativeToken(
  network: Network,
  chain: Chain,
): string | undefined {
  const platform = chainToPlatform(chain);

  if (platform === 'Evm') {
    return WETH_CONTRACTS[network]?.[chain];
  }

  if (platform === 'Solana') {
    return WSOL_ADDRESS;
  }

  return undefined;
}

/**
 * Determines if a token should be filtered out in same-chain swaps
 * based on native/wrapped token pair restrictions
 */
export function shouldFilterSameChainToken(
  sourceToken: { address: TokenAddress<Chain> } | null,
  wrappedNativeAddr: string | undefined,
  currentToken: { address: TokenAddress<Chain> },
): boolean {
  if (!sourceToken) {
    return false;
  }

  const sourceAddr = sourceToken.address.toString();
  const currentAddr = currentToken.address.toString();

  if (currentAddr === sourceAddr) {
    return true;
  }

  // Block native-wrapped token pairs if we have wrapped native address
  if (wrappedNativeAddr) {
    const srcIsNative = isNative(sourceToken.address);
    const srcIsWrapped = sourceAddr.toLowerCase() === wrappedNativeAddr;

    const destIsWrapped = currentAddr.toLowerCase() === wrappedNativeAddr;
    const destIsNative = isNative(currentToken.address);

    if ((srcIsNative && destIsWrapped) || (srcIsWrapped && destIsNative)) {
      return true;
    }
  }

  return false;
}
