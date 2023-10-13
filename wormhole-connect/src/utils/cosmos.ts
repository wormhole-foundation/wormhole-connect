import {
  ChainName,
  ChainId,
  isGatewayChain as isGatewayChainSdk,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from './sdk';

export function isGatewayChain(chainId: ChainId | ChainName): boolean {
  const id = wh.toChainId(chainId);
  return isGatewayChainSdk(id);
}
