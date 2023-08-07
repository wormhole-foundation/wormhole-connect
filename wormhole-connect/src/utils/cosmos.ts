import {
  CHAIN_ID_OSMOSIS,
  CHAIN_ID_WORMCHAIN,
  ChainId,
  ChainName,
  isCosmWasmChain as isBaseCosmWasmChain,
} from '@certusone/wormhole-sdk';
import { wh } from './sdk';

const COSMOS_CHAINS: ChainId[] = [CHAIN_ID_WORMCHAIN, CHAIN_ID_OSMOSIS];

export function isCosmWasmChain(chainId: ChainId | ChainName): boolean {
  const id = wh.toChainId(chainId);
  return isBaseCosmWasmChain(id) || COSMOS_CHAINS.includes(id);
}
