import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';

export function isGatewayChain(chainId: ChainId | ChainName): boolean {
  return false;
}
