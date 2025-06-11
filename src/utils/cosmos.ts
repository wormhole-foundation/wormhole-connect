//import config from 'config';

import { Chain } from '@wormhole-foundation/sdk';

export function isGatewayChain(chain: Chain): boolean {
  return false;

  /* TODO SDKV2
  const id = config.wh.toChainId(chainId);
  return isGatewayChainSdk(id);
  */
}
