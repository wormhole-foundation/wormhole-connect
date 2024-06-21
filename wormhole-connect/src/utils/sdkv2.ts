import { getWormholeContextV2 } from 'config';
import {
  Wormhole,
  TokenId,
  Chain,
  NativeAddress,
} from '@wormhole-foundation/sdk';
import { TokenConfig } from 'config/types';
//import config from 'config';

export async function getForeignTokenAddress<C extends Chain>(
  token: TokenConfig,
  chain: C,
): Promise<NativeAddress<C> | undefined> {
  const wh = await getWormholeContextV2();
  const chainContext = wh.getChain(chain);

  let foreignToken = chainContext.config.tokenMap?.[token.key];
  if (foreignToken) {
    // Use cached value
    //console.log('returning cached fa');
    return Wormhole.parseAddress(chain, foreignToken.address);
  }

  return undefined;

  /*
  // TODO SDKV2 fetch dynamically and save in a to cache

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
