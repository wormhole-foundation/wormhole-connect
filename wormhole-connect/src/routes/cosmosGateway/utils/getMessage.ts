import { CHAIN_ID_WORMCHAIN, ChainId, cosmos } from '@certusone/wormhole-sdk';
import { logs as cosmosLogs } from '@cosmjs/stargate';
import {
  ChainName,
  CosmosContext,
  WormholeContext,
  searchCosmosLogs,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, utils } from 'ethers';
import { arrayify, base58 } from 'ethers/lib/utils.js';
import { ParsedMessage, wh } from 'utils/sdk';
import { isGatewayChain } from '../../../utils/cosmos';
import { UnsignedMessage } from '../../types';
import { adaptParsedMessage } from '../../utils';
import {
  FromCosmosPayload,
  GatewayTransferMsg,
  IBCTransferData,
} from '../types';
import { getCosmWasmClient } from '../utils';
import {
  findDestinationIBCTransferTx,
  getIBCTransferInfoFromLogs,
} from './transaction';

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
  const ibcPacketInfo = getIBCTransferInfoFromLogs(tx, 'send_packet');

  // extract the IBC transfer data payload from the packet
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
    emitterAddress: '',
    sequence: BigNumber.from(0),
  });

  return {
    ...base,
    fromChain: chain,
    sender,
  };
}

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

export async function getUnsignedMessageFromNonCosmos(
  hash: string,
  chain: ChainName,
): Promise<UnsignedMessage> {
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
  const ibcInfo = getIBCTransferInfoFromLogs(tx, 'send_packet');

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
