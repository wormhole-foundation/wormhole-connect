import { CHAIN_ID_SOLANA, CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import { CosmosTransaction } from '@xlabs-libs/wallet-aggregator-cosmos';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { arrayify } from 'ethers/lib/utils.js';
import {
  Coin,
  IbcExtension,
  MsgTransferEncodeObject,
  QueryClient,
  calculateFee,
  logs as cosmosLogs,
  setupIbcExtension,
} from '@cosmjs/stargate';
import {
  Tendermint34Client,
  Tendermint37Client,
  TendermintClient,
} from '@cosmjs/tendermint-rpc';
import {
  ChainId,
  ChainName,
  TokenId,
  searchCosmosLogs,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { FromCosmosPayload, GatewayTransferMsg } from './types';
import {
  TransferWallet,
  isCosmWasmChain,
  signAndSendTransaction,
  wh,
} from 'utils';
import { CHAINS, RPCS } from 'config';
import { UnsignedMessage } from 'routes/types';
import { adaptParsedMessage } from 'routes/common';

export const IBC_MSG_TYPE = '/ibc.applications.transfer.v1.MsgTransfer';
export const IBC_PORT = 'transfer';
export const IBC_TIMEOUT_MILLIS = 10 * 60 * 1000; // 10 minutes

const millisToNano = (seconds: number) => seconds * 1_000_000;

let CLIENT_MAP: Record<string, TendermintClient> = {};

export function getTranslatorAddress(): string {
  const addr = CHAINS['wormchain']?.contracts.ibcShimContract;
  if (!addr) throw new Error('IBC Shim contract not configured');
  return addr;
}

export async function getIbcSourceChannel(
  chain: ChainId | ChainName,
): Promise<string> {
  const id = wh.toChainId(chain);
  if (!isCosmWasmChain(id)) throw new Error('Chain is not cosmos chain');
  const client = await getCosmWasmClient(CHAIN_ID_WORMCHAIN);
  const { channel } = await client.queryContractSmart(getTranslatorAddress(), {
    ibc_channel: {
      chain_id: id,
    },
  });
  return channel;
}

export async function getIbcDestinationChannel(
  chain: ChainId | ChainName,
): Promise<string> {
  const sourceChannel = await getIbcSourceChannel(chain);
  const queryClient = await getQueryClient(CHAIN_ID_WORMCHAIN);
  const conn = await queryClient.ibc.channel.channel(IBC_PORT, sourceChannel);

  const destChannel = conn.channel?.counterparty?.channelId;
  if (!destChannel) {
    throw new Error(`No destination channel found on chain ${chain}`);
  }

  return destChannel;
}

export async function getQueryClient(
  chain: ChainId | ChainName,
): Promise<QueryClient & IbcExtension> {
  const tmClient = await getTmClient(chain);
  return QueryClient.withExtensions(tmClient, setupIbcExtension);
}

export async function getTmClient(
  chain: ChainId | ChainName,
): Promise<Tendermint34Client | Tendermint37Client> {
  const name = wh.toChainName(chain);
  if (CLIENT_MAP[name]) {
    return CLIENT_MAP[name];
  }

  const rpc = RPCS[wh.toChainName(chain)];
  if (!rpc) throw new Error(`${chain} RPC not configured`);

  // from cosmjs: https://github.com/cosmos/cosmjs/blob/358260bff71c9d3e7ad6644fcf64dc00325cdfb9/packages/stargate/src/stargateclient.ts#L218
  let tmClient: TendermintClient;
  const tm37Client = await Tendermint37Client.connect(rpc);
  const version = (await tm37Client.status()).nodeInfo.version;
  if (version.startsWith('0.37.')) {
    tmClient = tm37Client;
  } else {
    tm37Client.disconnect();
    tmClient = await Tendermint34Client.connect(rpc);
  }

  CLIENT_MAP[name] = tmClient;

  return tmClient;
}

export async function getCosmWasmClient(
  chain: ChainId | ChainName,
): Promise<CosmWasmClient> {
  const tmClient = await getTmClient(chain);
  return CosmWasmClient.create(tmClient);
}

export function buildToCosmosPayload(
  recipientChainId: ChainId,
  recipientAddress: string,
): Buffer {
  const nonce = Math.round(Math.random() * 10000);
  const recipient = Buffer.from(recipientAddress).toString('base64');

  const payloadObject: GatewayTransferMsg = {
    gateway_transfer: {
      chain: recipientChainId,
      nonce,
      recipient,
      fee: '0',
    },
  };

  return Buffer.from(JSON.stringify(payloadObject));
}

export async function toCosmos(
  token: TokenId | 'native',
  amount: string,
  sendingChainId: ChainId,
  senderAddress: string,
  recipientChainId: ChainId,
  recipientAddress: string,
  routeOptions: any,
): Promise<any> {
  const payload = buildToCosmosPayload(recipientChainId, recipientAddress);

  const tx = await wh.send(
    token,
    amount,
    sendingChainId,
    senderAddress,
    CHAIN_ID_WORMCHAIN,
    getTranslatorAddress(),
    undefined,
    payload,
  );

  return signAndSendTransaction(
    wh.toChainName(sendingChainId),
    tx,
    TransferWallet.SENDING,
  );
}

export function buildFromCosmosPayloadMemo(
  recipientChainId: ChainId,
  recipientAddress: string,
): string {
  const nonce = Math.round(Math.random() * 10000);

  const destContext = wh.getContext(recipientChainId);
  const recipient = Buffer.from(
    destContext.formatAddress(recipientAddress),
  ).toString('base64');

  const payloadObject: FromCosmosPayload = {
    gateway_ibc_token_bridge_payload: {
      gateway_transfer: {
        chain: recipientChainId,
        nonce,
        recipient,
        fee: '0',
      },
    },
  };

  return JSON.stringify(payloadObject);
}

export async function fromCosmos(
  token: TokenId | 'native',
  amount: string,
  sendingChainId: ChainId,
  senderAddress: string,
  recipientChainId: ChainId,
  recipientAddress: string,
  routeOptions: any,
): Promise<any> {
  if (token === 'native') throw new Error('Native token not supported');

  let recipient = recipientAddress;
  // get token account for solana
  if (recipientChainId === CHAIN_ID_SOLANA) {
    const account = await (
      wh.getContext(CHAIN_ID_SOLANA) as SolanaContext<WormholeContext>
    ).getAssociatedTokenAddress(token, recipientAddress);
    recipient = account.toString();
  }

  const memo = buildFromCosmosPayloadMemo(recipientChainId, recipient);

  const denom = await wh.getForeignAsset(token, sendingChainId);
  if (!denom) throw new Error('Could not derive IBC asset denom');
  const coin: Coin = {
    denom,
    amount,
  };
  const channel = await getIbcDestinationChannel(sendingChainId);
  const ibcMessage: MsgTransferEncodeObject = {
    typeUrl: IBC_MSG_TYPE,
    value: MsgTransfer.fromPartial({
      sourcePort: IBC_PORT,
      sourceChannel: channel,
      sender: senderAddress,
      receiver: getTranslatorAddress(),
      token: coin,
      timeoutTimestamp: millisToNano(Date.now() + IBC_TIMEOUT_MILLIS),
      memo,
    }),
  };

  const tx: CosmosTransaction = {
    fee: calculateFee(1000000, '1.0uosmo'),
    msgs: [ibcMessage],
    memo: '',
  };

  return signAndSendTransaction(
    wh.toChainName(sendingChainId),
    tx,
    TransferWallet.SENDING,
  );
}

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

  // Extract IBC transfer info initiated on the source chain
  const logs = cosmosLogs.parseRawLog(tx.rawLog);
  const packetSeq = searchCosmosLogs('packet_sequence', logs);
  const packetTimeout = searchCosmosLogs('packet_timeout_timestamp', logs);
  const packetSrcChannel = searchCosmosLogs('packet_src_channel', logs);
  const packetDstChannel = searchCosmosLogs('packet_dst_channel', logs);
  if (!packetSeq || !packetTimeout || !packetSrcChannel || !packetDstChannel) {
    throw new Error('Missing packet information in transaction logs');
  }

  // Look for the matching IBC receive on wormchain
  // The IBC hooks middleware will execute the translator contract
  // and include the execution logs on the transaction
  // which can be used to extract the VAA
  const wormchainClient = await getCosmWasmClient(CHAIN_ID_WORMCHAIN);
  const destTx = await wormchainClient.searchTx([
    { key: 'recv_packet.packet_sequence', value: packetSeq },
    { key: 'recv_packet.packet_timeout_timestamp', value: packetTimeout },
    { key: 'recv_packet.packet_src_channel', value: packetSrcChannel },
    { key: 'recv_packet.packet_dst_channel', value: packetDstChannel },
  ]);
  if (destTx.length === 0) {
    throw new Error(
      `No wormchain transaction found for packet by ${hash} on chain ${chain}`,
    );
  }
  if (destTx.length > 1) {
    throw new Error(
      `Multiple transactions found for the same packet by ${hash} on chain ${chain}`,
    );
  }

  const sender = searchCosmosLogs('sender', logs);
  if (!sender) throw new Error('Missing sender in transaction logs');

  const message = await wh.getMessage(destTx[0].hash, CHAIN_ID_WORMCHAIN);
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
