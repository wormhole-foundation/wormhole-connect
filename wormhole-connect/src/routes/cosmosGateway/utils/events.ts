import { CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import { utils } from 'ethers';
import {
  SignedRelayTransferMessage,
  SignedTokenTransferMessage,
} from '../../types';
import { getCosmWasmClient } from './client';
import { getTranslatorAddress } from './contracts';
import {
  findDestinationIBCTransferTx,
  getTransactionIBCTransferInfo,
} from './transaction';
import { BridgeRoute } from '../../bridge';
import { isGatewayChain } from '../../../utils/cosmos';

export async function fetchRedeemedEventNonCosmosSource(
  message: SignedTokenTransferMessage | SignedRelayTransferMessage,
): Promise<string | null> {
  const wormchainClient = await getCosmWasmClient(CHAIN_ID_WORMCHAIN);
  if (!message.payload) {
    throw new Error('Missing payload from transfer');
  }

  // find the transaction on wormchain based on the gateway transfer payload
  // since it has a nonce, we can assume it will be unique
  const txs = await wormchainClient.searchTx([
    { key: 'wasm.action', value: 'complete_transfer_with_payload' },
    { key: 'wasm.recipient', value: getTranslatorAddress() },
    {
      key: 'wasm.transfer_payload',
      value: Buffer.from(utils.arrayify(message.payload)).toString('base64'),
    },
  ]);
  if (txs.length === 0) {
    return null;
  }
  if (txs.length > 1) {
    throw new Error('Multiple transactions found');
  }

  // extract the ibc transfer info from the transaction logs
  const ibcInfo = getTransactionIBCTransferInfo(txs[0], 'send_packet');

  // find the transaction on the target chain based on the ibc transfer info
  const destTx = await findDestinationIBCTransferTx(message.toChain, ibcInfo);
  if (!destTx) {
    throw new Error(`No redeem transaction found on chain ${message.toChain}`);
  }
  return destTx.hash;
}

/**
 * Find the redeem/receive funds transaction on the destination chain
 */
export async function fetchRedeemedEventCosmosSource(
  message: SignedTokenTransferMessage | SignedRelayTransferMessage,
): Promise<string | null> {
  if (!isGatewayChain(message.toChain)) {
    return (await new BridgeRoute().tryFetchRedeemTx(message)) || null;
  }

  /**
   * When sending an IBC transfer from a chain A to B, the following happens:
   *  i. A transaction is executed on blockchain A which emmits a send_packet and an ibc_transfer event,
   * the former contains the ibc packet information, while the later holds the denom/amount to transfer
   *  ii. The relayer picks up the packet and delivers it to B through a transaction, which emmits 3 events:
   * recv_packet, fungible_token_packet, and write_acknowledgement. The ACK event means that the packet was
   * processed succesfully, which in this case means the funds arrived to the address on B
   *  iii. The relayer then sends a transaction on A to acknowledge the packet, which emmits an
   * acknowledge_packet event which has the same data as the original send_packet event
   *
   * For cosmos to cosmos transfers, the chain is A->Wormchain->B, each of these interactions follows the
   * procedure described above. However, Wormchain acts a "packet forwarder", so instead of writing the ACK
   * to A as soon as it receives the first transfer, it will hold that ACK until it's received the ACK of the
   * transfer to B. This means that the tx on wormchain which receives the packet from A won't emit the ACK event;
   * this will be done at a later transaction when the relayer has confirmed that the tx from wormchain to B has
   * processed succesfully, emitting two events: a write_acknowledgement for the Wormchain->B transfer, followed by
   * a write_acknowledgement for the A->Wormchain transfer. It is after this second tx on wormchain that the relayer
   * delivers the ack back to A.
   *
   * So, the process to get the transaction on B which receives the funds will be the following:
   *  i. Extract the first ibc transfer packet information from the tx on A by scanning the send_packet event
   *  ii. Look for the write_acknowledgement transaction on wormchain
   *  iii. From that same transaction, extract the Wormchain->B ibc packet information present in the acknowledge_packet
   * event.
   *  iv. Now that we have the ibc packet info for Wormchain->B, search for the write_acknowledgement on the destination chain
   */

  // find tx in the source chain and extract the ibc transfer to wormchain
  const sourceClient = await getCosmWasmClient(message.fromChain);
  const tx = await sourceClient.getTx(message.sendTx);
  if (!tx) return null;
  const sourceIbcInfo = getTransactionIBCTransferInfo(tx, 'send_packet');

  // find the tx on wormchain that writes the acknowledgement back to source chain
  const wormchainTx = await findDestinationIBCTransferTx(
    CHAIN_ID_WORMCHAIN,
    sourceIbcInfo,
  );
  if (!wormchainTx) return null;

  // extract the ibc packet info for Wormchain->dest chain from
  // the event that receives the ACK for that transfer
  const wormchainToDestIbcInfo = getTransactionIBCTransferInfo(
    wormchainTx,
    'acknowledge_packet',
  );

  // find the tx that deposits the funds in the final recipient
  const destTx = await findDestinationIBCTransferTx(
    message.toChain,
    wormchainToDestIbcInfo,
  );
  if (!destTx) return null;
  return destTx.hash;
}
