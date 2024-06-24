import { getWormholeContextV2 } from 'config';
import {
  Wormhole,
  TokenId,
  TokenKey,
  Chain,
  NativeAddress,
} from '@wormhole-foundation/sdk';
//import config from 'config';

export async function getForeignTokenAddress<C extends Chain>(
  token: TokenId,
  chain: C,
): Promise<NativeAddress<C> | null> {
  const wh = await getWormholeContextV2();
  const originChainContext = wh.getChain(token.chain);
  const chainContext = wh.getChain(chain);

  // TODO  SDKV2
  // tokenMap in SDKv2 is keyed by token key, but all Connect code wants to pass in a TokenId
  // which doesn't have the token key. So to avoid changing too much Connect code right now
  // we're just iterating over all values in tokenMap to find the token.

  // First, get token key from origin chain
  let tokenKey: TokenKey | null = null;
  for (let tc of Object.values(originChainContext.config.tokenMap || {})) {
    if (tc.address === token.address.toString()) {
      tokenKey = tc.key;
    }
  }

  if (tokenKey) {
    let chainToken = chainContext.config.tokenMap?.[tokenKey];
    if (chainToken) {
      // Use cached value
      //console.log('returning cached fa');
      return Wormhole.parseAddress(chain, chainToken.address);
    }
  } else {
    console.error(`Couldn't find token key for ${token}`);
  }

  return null;

  /*
  // TODO SDKV2 fetch dynamically and save in cache

  const tb = await chainContext.getTokenBridge();
  const wrapped = await tb.getWrappedAsset(config.sdkConverter.toTokenIdV2(token));
  return wrapped;
  */
}

export async function getDecimals(
  token: TokenId,
  chain: Chain,
): Promise<number> {
  const wh = await getWormholeContextV2();
  return await wh.getDecimals(chain, token.address);
}
