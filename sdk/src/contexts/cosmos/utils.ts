import {
  CHAIN_ID_COSMOSHUB,
  CHAIN_ID_EVMOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_KUJIRA,
  CHAIN_ID_OSMOSIS,
  CHAIN_ID_WORMCHAIN,
} from '@certusone/wormhole-sdk';
import { Event } from '@cosmjs/stargate';
import { ChainId } from '../../types';

/**
 * Search for a specific piece of information emitted by the contracts during the transaction
 * For example: to retrieve the bridge transfer recipient, we would have to look
 * for the "transfer.recipient" under the "wasm" event
 */
export const searchCosmosEvents = (
  key: string,
  events: readonly Event[],
): string | null => {
  const parts = key.split('.');

  // if event, search for the first attribute with the given key
  const [event, attribute] =
    parts.length > 1
      ? [parts[0], parts.slice(1).join('.')]
      : [undefined, parts[0]];

  for (const ev of events) {
    if (event && ev.type !== event) continue;
    for (const attr of ev.attributes) {
      if (attr.key === attribute) {
        return attr.value;
      }
    }
  }

  return null;
};

const GATEWAY_CHAINS: ChainId[] = [
  CHAIN_ID_COSMOSHUB,
  CHAIN_ID_EVMOS,
  CHAIN_ID_OSMOSIS,
  CHAIN_ID_WORMCHAIN,
  CHAIN_ID_KUJIRA,
  CHAIN_ID_INJECTIVE,
];

export function isGatewayChain(chainId: ChainId): boolean {
  return GATEWAY_CHAINS.includes(chainId);
}
