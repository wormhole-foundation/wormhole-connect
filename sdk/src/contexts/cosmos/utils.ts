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
