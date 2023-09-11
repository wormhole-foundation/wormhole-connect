import {
  ChainName,
  ChainId,
  isCosmWasmChain as isCosmWasmChainSdk,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { wh } from './sdk';

export function isCosmWasmChain(chainId: ChainId | ChainName): boolean {
  const id = wh.toChainId(chainId);
  return isCosmWasmChainSdk(id);
}
