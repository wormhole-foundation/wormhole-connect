import { getWormholeContextV2 } from 'config';
import { TokenConfig } from 'config/types';
import { TokenId, Chain, TokenAddress } from '@wormhole-foundation/sdk';
import config from 'config';

// This function has three levels of priority when fetching a token bridge
// foreign asset address.
//
// 1. Check built-in config
// 2. Check cache
// 3. Fetch the address on chain using RPC (& cache this for next time)
export async function getTokenBridgeWrappedTokenAddress<C extends Chain>(
  token: TokenConfig,
  chain: C,
): Promise<TokenAddress<C> | null> {
  // Try cache first
  let cached = config.wrappedTokenAddressCache.get(token.key, chain);
  if (cached) {
    return cached;
  }

  // Fetch live and cache
  const wh = await getWormholeContextV2();
  const chainContext = wh.getChain(chain);
  const tb = await chainContext.getTokenBridge();

  console.info(
    `Resolving foreign address for token ${token.key} on chain ${chain}`,
  );

  const tokenId = config.sdkConverter.toTokenIdV2(token);
  const wrapped = await tb.getWrappedAsset(tokenId);

  if (wrapped) {
    config.wrappedTokenAddressCache.set(token.key, chain, wrapped);
  }

  return wrapped;
}

export async function getDecimals(
  token: TokenId,
  chain: Chain,
): Promise<number> {
  const wh = await getWormholeContextV2();
  return await wh.getDecimals(chain, token.address);
}
