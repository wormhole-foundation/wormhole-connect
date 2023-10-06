import { CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import { logs as cosmosLogs } from '@cosmjs/stargate';
import {
  ChainName,
  searchCosmosLogs,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { arrayify } from 'ethers/lib/utils.js';
import { wh } from 'utils/sdk';
import { adaptParsedMessage } from '../../utils';
import { UnsignedMessage } from '../../types';
import { getCosmWasmClient } from '../utils';
import { GatewayTransferMsg } from '../types';
import {
  findDestinationIBCTransferTx,
  getIBCTransferInfoFromLogs,
} from './transaction';

export async function getMessageFromNonCosmos(
  hash: string,
  chain: ChainName,
): Promise<UnsignedMessage> {
  // const message = await wh.getMessage(hash, chain);
  // return adaptParsedMessage(message);
  const message = await wh.getMessage(hash, chain);
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

export async function getMessageFromCosmos(
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
  const ibcInfo = getIBCTransferInfoFromLogs(tx);

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

  const message = await wh.getMessage(destTx.hash, CHAIN_ID_WORMCHAIN);
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
