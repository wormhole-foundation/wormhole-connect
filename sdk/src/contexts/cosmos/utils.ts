import {
  CHAIN_ID_OSMOSIS,
  CHAIN_ID_TERRA2,
  CHAIN_ID_WORMCHAIN,
  isCosmWasmChain as isBaseCosmWasmChain,
} from '@certusone/wormhole-sdk';
import { logs as cosmosLogs } from '@cosmjs/stargate';
import { ChainId } from '../../types';

/**
 * Search for a specific piece of information emitted by the contracts during the transaction
 * For example: to retrieve the bridge transfer recipient, we would have to look
 * for the "transfer.recipient" under the "wasm" event
 */
export const searchCosmosLogs = (
  key: string,
  logs: readonly cosmosLogs.Log[],
): string | null => {
  for (const log of logs) {
    for (const ev of log.events) {
      for (const attr of ev.attributes) {
        if (attr.key === key) {
          return attr.value;
        }
      }
    }
  }
  return null;
};

const COSMOS_CHAINS: ChainId[] = [
  CHAIN_ID_WORMCHAIN,
  CHAIN_ID_OSMOSIS,
  CHAIN_ID_TERRA2,
];

export function isCosmWasmChain(chainId: ChainId): boolean {
  return isBaseCosmWasmChain(chainId) || COSMOS_CHAINS.includes(chainId);
}
