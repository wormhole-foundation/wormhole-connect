import { IndexedTx, Event } from '@cosmjs/stargate';
import {
  ChainId,
  ChainName,
  searchCosmosEvents,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { getCosmWasmClient } from '../utils';
import { IBCTransferInfo } from '../types';

/**
 * Search the ibc transfer info (sequence, timeout, src channel, dst channel, data) from an event
 * emitted by a transaction
 */
export function getTransactionIBCTransferInfo(
  tx: IndexedTx,
  event: 'send_packet' | 'write_acknowledgement' | 'acknowledge_packet',
): IBCTransferInfo {
  return getIBCTransferInfoFromEvents(tx.events, event);
}

/**
 * Search the ibc transfer info (sequence, timeout, src channel, dst channel, data) in
 * the transaction events array
 */
export function getIBCTransferInfoFromEvents(
  events: readonly Event[],
  event: 'send_packet' | 'write_acknowledgement' | 'acknowledge_packet',
): IBCTransferInfo {
  const packetSeq = searchCosmosEvents(`${event}.packet_sequence`, events);
  const packetTimeout = searchCosmosEvents(
    `${event}.packet_timeout_timestamp`,
    events,
  );
  const packetSrcChannel = searchCosmosEvents(
    `${event}.packet_src_channel`,
    events,
  );
  const packetDstChannel = searchCosmosEvents(
    `${event}.packet_dst_channel`,
    events,
  );
  const packetData = searchCosmosEvents(`${event}.packet_data`, events);
  if (!packetSeq || !packetTimeout || !packetSrcChannel || !packetDstChannel) {
    throw new Error('Missing packet information in transaction events');
  }
  return {
    sequence: packetSeq,
    timeout: packetTimeout,
    srcChannel: packetSrcChannel,
    dstChannel: packetDstChannel,
    data: packetData,
  };
}

export async function findDestinationIBCTransferTx(
  destChain: ChainName | ChainId,
  ibcInfo: IBCTransferInfo,
): Promise<IndexedTx | undefined> {
  const wormchainClient = await getCosmWasmClient(destChain);
  const destTx = await wormchainClient.searchTx([
    { key: 'write_acknowledgement.packet_sequence', value: ibcInfo.sequence },
    {
      key: 'write_acknowledgement.packet_timeout_timestamp',
      value: ibcInfo.timeout,
    },
    {
      key: 'write_acknowledgement.packet_src_channel',
      value: ibcInfo.srcChannel,
    },
    {
      key: 'write_acknowledgement.packet_dst_channel',
      value: ibcInfo.dstChannel,
    },
  ]);
  if (destTx.length === 0) {
    return undefined;
  }
  if (destTx.length > 1) {
    throw new Error(
      `Multiple transactions found for the same packet on chain ${destChain}`,
    );
  }
  return destTx[0];
}
