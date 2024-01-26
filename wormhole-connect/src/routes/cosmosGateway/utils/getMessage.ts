import {
  CHAIN_ID_WORMCHAIN,
  cosmos,
  parseTokenTransferPayload,
} from '@certusone/wormhole-sdk';
import { decodeTxRaw } from '@cosmjs/proto-signing';
import { logs as cosmosLogs } from '@cosmjs/stargate';
import {
  ChainId,
  ChainName,
  CosmosContext,
  WormholeContext,
  searchCosmosLogs,
  ParsedMessage as SdkParsedMessage,
  ParsedRelayerMessage as SdkParsedRelayerMessage,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';
import { arrayify, base58, hexlify } from 'ethers/lib/utils.js';
import { ParsedMessage, wh } from 'utils/sdk';
import { isGatewayChain } from '../../../utils/cosmos';
import { UnsignedMessage } from '../../types';
import { adaptParsedMessage } from '../../utils';
import {
  FromCosmosPayload,
  GatewayTransferMsg,
  IBCTransferData,
  IBCTransferInfo,
} from '../types';
import { getCosmWasmClient } from '../utils';
import {
  findDestinationIBCTransferTx,
  getIBCTransferInfoFromLogs,
  getTransactionIBCTransferInfo,
} from './transaction';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

/**
 * Extract the transfer information from a gateway chain transfer without
 * looking for an attestation/vaa
 *
 * @param hash Transaction id/hash
 * @param chain Source chain
 * @returns An unsigned message (transfer information without an attestation/VAA)
 */
export async function getUnsignedMessageFromCosmos(
  hash: string,
  chain: ChainName,
): Promise<ParsedMessage> {
  // Get tx on the source chain (e.g. osmosis)
  const sourceClient = await getCosmWasmClient(chain);
  const tx = await sourceClient.getTx(hash);
  if (!tx) {
    throw new Error(`Transaction ${hash} not found on chain ${chain}`);
  }

  const logs = cosmosLogs.parseRawLog(tx.rawLog);
  const sender = searchCosmosLogs('sender', logs);
  if (!sender) throw new Error('Missing sender in transaction logs');

  // get the information of the ibc transfer started by the source chain
  const ibcPacketInfo = getTransactionIBCTransferInfo(tx, 'send_packet');

  // extract the IBC transfer data payload from the packet
  if (!ibcPacketInfo.data) throw new Error('Missing packet data');
  const data: IBCTransferData = JSON.parse(ibcPacketInfo.data);
  const payload: FromCosmosPayload = JSON.parse(data.memo);

  const destChain = wh.toChainName(
    payload.gateway_ibc_token_bridge_payload.gateway_transfer.chain,
  );
  const destContext = wh.getContext(destChain);
  const payloadRecipient =
    payload.gateway_ibc_token_bridge_payload.gateway_transfer.recipient;
  const recipient = isGatewayChain(destChain)
    ? // cosmos addresses are base64 encoded
      Buffer.from(payloadRecipient, 'base64').toString()
    : // receiver is an external address, decode through the chain context
      destContext.parseAddress(
        '0x' + Buffer.from(payloadRecipient, 'base64').toString('hex'),
      );

  const { tokenAddress, tokenChain } = await getOriginalIbcDenomInfo(
    data.denom,
  );

  const base = await adaptParsedMessage({
    fromChain: chain,
    sendTx: tx.hash,
    toChain: destChain,
    amount: BigNumber.from(data.amount),
    recipient,
    block: tx.height,
    sender: data.sender,
    gasFee: BigNumber.from(tx.gasUsed.toString()),
    payloadID: 1, // no vaa, but wormchain will eventually emit a normal transfer
    tokenChain,
    tokenAddress,
    tokenId: {
      address: tokenAddress,
      chain: tokenChain,
    },
  });

  return {
    ...base,
    fromChain: chain,
    sender,
  };
}

/**
 * Given an IBC denom (e.g. ibc/397DFE63D87F694...) find the asset's token id
 * (source chain and address)
 */
async function getOriginalIbcDenomInfo(
  denom: string,
): Promise<{ tokenAddress: string; tokenChain: ChainName }> {
  // transfer ibc denom follows the scheme {port}/{channel}/{denom}
  // with denom as {tokenfactory}/{ibc shim}/{bas58 cw20 address}
  // so 5 elements total
  const parts = denom.split('/');
  if (parts.length !== 5) {
    throw new Error(`Unexpected transfer denom ${denom}`);
  }
  const factoryDenom = parts.slice(2).join('/');
  const cw20 = factoryToCW20(factoryDenom);
  const context = wh.getContext(
    CHAIN_ID_WORMCHAIN,
  ) as CosmosContext<WormholeContext>;
  const { chainId, assetAddress: tokenAddressBytes } =
    await context.getOriginalAsset(CHAIN_ID_WORMCHAIN, cw20);
  const tokenChain = wh.toChainName(chainId as ChainId); // wormhole-sdk adds 0 (unset) as a chainId
  const tokenContext = wh.getContext(tokenChain);
  const tokenAddress = await tokenContext.parseAssetAddress(
    utils.hexlify(tokenAddressBytes),
  );

  return {
    tokenAddress,
    tokenChain,
  };
}

/**
 * Extract the transfer information from a non-gateway chain transfer without
 * looking for an attestation/vaa
 *
 * @param hash Transaction id/hash
 * @param chain Source chain
 * @returns An unsigned message (transfer information without an attestation/VAA)
 */
export async function getUnsignedMessageFromNonCosmos(
  hash: string,
  chain: ChainName,
): Promise<UnsignedMessage> {
  const message = await wh.getMessage(hash, chain, false);
  if (!message.payload)
    throw new Error(`Missing payload from message ${hash} on chain ${chain}`);
  const decoded: GatewayTransferMsg = JSON.parse(
    Buffer.from(
      arrayify(message.payload, { allowMissingPrefix: true }),
    ).toString(),
  );
  const adapted: any = await adaptParsedMessage({
    ...message,
    recipient: Buffer.from(
      decoded.gateway_transfer.recipient,
      'base64',
    ).toString(),
    toChain: wh.toChainName(decoded.gateway_transfer.chain),
  });

  return {
    ...adapted,
    // the context assumes that if the transfer is payload 3, it's a relayer transfer
    // but in this case, it is not, so we clear these fields
    relayerFee: '0',
    toNativeTokenAmount: '0',
  };
}

/**
 * Get the CW20 contract address given a tokenfactory denom
 */
function factoryToCW20(denom: string): string {
  if (!denom.startsWith('factory/')) return '';
  const encoded = denom.split('/')[2];
  if (!encoded) return '';
  return cosmos.humanAddress('wormhole', base58.decode(encoded));
}

export async function getMessageFromWormchain(
  hash: string,
  chain: ChainName,
): Promise<UnsignedMessage> {
  // Get tx on the source chain (e.g. osmosis)
  const sourceClient = await getCosmWasmClient(chain);
  const tx = await sourceClient.getTx(hash);
  if (!tx) {
    throw new Error(`Transaction ${hash} not found on chain ${chain}`);
  }

  const logs = cosmosLogs.parseRawLog(tx.rawLog);
  const sender = searchCosmosLogs('sender', logs);
  if (!sender) throw new Error('Missing sender in transaction logs');

  // Extract IBC transfer info initiated on the source chain
  const ibcInfo = getTransactionIBCTransferInfo(tx, 'send_packet');

  // Look for the matching IBC receive on wormchain
  // The IBC hooks middleware will execute the translator contract
  // and include the execution logs on the transaction
  // which can be used to extract the VAA
  const destTx = await findDestinationIBCTransferTx(
    CHAIN_ID_WORMCHAIN,
    ibcInfo,
  );
  if (!destTx) {
    throw new Error(
      `No wormchain transaction found for packet on chain ${chain}`,
    );
  }

  const message = await getWormchainEmittedMessage(destTx.hash, ibcInfo);
  const parsed = await adaptParsedMessage(message);

  return {
    ...parsed,
    // add the original source chain and tx hash to the info
    // the vaa contains only the wormchain information
    fromChain: wh.toChainName(chain),
    sendTx: hash,
    sender,
  };
}

/**
 * Parse a wormchain tx to extract the VAA information
 *
 * @param id Wormchain transaction id
 * @param sourceTxIbcInfo IBC packet information of the source transaction
 * @returns
 */
async function getWormchainEmittedMessage(
  id: string,
  sourceTxIbcInfo: IBCTransferInfo,
): Promise<SdkParsedMessage | SdkParsedRelayerMessage> {
  const client = await getCosmWasmClient(CHAIN_ID_WORMCHAIN);
  const tx = await client.getTx(id);
  if (!tx) throw new Error('tx not found');

  // parse logs emitted for the tx execution
  // and find the log for the specific ibc transfer
  const logs = cosmosLogs.parseRawLog(tx.rawLog);
  const msgLog = getIbcTransferLog(logs, sourceTxIbcInfo);

  // now look for the vaa information in the message logs
  const tokenTransferPayload = searchCosmosLogs('wasm.message.message', [
    msgLog,
  ]);
  if (!tokenTransferPayload)
    throw new Error('message/transfer payload not found');
  const sequence = searchCosmosLogs('wasm.message.sequence', [msgLog]);
  if (!sequence) throw new Error('sequence not found');
  const emitterAddress = searchCosmosLogs('wasm.message.sender', [msgLog]);
  if (!emitterAddress) throw new Error('emitter not found');

  const parsed = parseTokenTransferPayload(
    Buffer.from(tokenTransferPayload, 'hex'),
  );

  const decoded = decodeTxRaw(tx.tx);
  const { sender } = MsgExecuteContract.decode(decoded.body.messages[0].value);

  const destContext = wh.getContext(parsed.toChain as ChainId);
  const tokenContext = wh.getContext(parsed.tokenChain as ChainId);

  const tokenAddress = await tokenContext.parseAssetAddress(
    hexlify(parsed.tokenAddress),
  );
  const tokenChain = wh.toChainName(parsed.tokenChain);

  return {
    sendTx: tx.hash,
    sender,
    amount: BigNumber.from(parsed.amount),
    payloadID: parsed.payloadType,
    recipient: destContext.parseAddress(hexlify(parsed.to)),
    toChain: wh.toChainName(parsed.toChain),
    fromChain: 'wormchain',
    tokenAddress,
    tokenChain,
    tokenId: {
      address: tokenAddress,
      chain: tokenChain,
    },
    sequence: BigNumber.from(sequence),
    emitterAddress,
    block: tx.height,
    gasFee: BigNumber.from(tx.gasUsed),
    payload: parsed.tokenTransferPayload.length
      ? hexlify(parsed.tokenTransferPayload)
      : undefined,
  };
}

/**
 * Find the log entry in the transaction logs for a given IBC transfer
 * (sometimes an ibc relayer can deliver multiple ibc packets
 * in the same transaction, so we need to find the one that matches)
 *
 * @param logs The transaction logs
 * @param ibcTransfer The IBC transfer to look a receive message for
 * @returns The Log entry for the IBC transfer receive message
 */
function getIbcTransferLog(
  logs: readonly cosmosLogs.Log[],
  ibcTransfer: IBCTransferInfo,
): cosmosLogs.Log {
  // the log list consists in one per msg, which contains multiple events
  // we're interested in a single ibc acknolwedgement/receive msg
  for (const log of logs) {
    for (const ev of log.events) {
      // find an ibc received packet event
      if (ev.type !== 'write_acknowledgement') continue;

      // check that this packet is the one that matches the source ibc transfer
      // if not, skip this msg log entirely and proceed to the next one
      const logIbcInfo = getIBCTransferInfoFromLogs(
        [log],
        'write_acknowledgement',
      );

      if (
        logIbcInfo.sequence !== ibcTransfer.sequence ||
        logIbcInfo.srcChannel !== ibcTransfer.srcChannel ||
        logIbcInfo.dstChannel !== ibcTransfer.dstChannel
      )
        break;

      return log;
    }
  }
  throw new Error(
    `No log found for IBC transfer sequence ${ibcTransfer.sequence}`,
  );
}
