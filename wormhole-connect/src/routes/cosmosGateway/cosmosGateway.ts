import {
  CHAIN_ID_SOLANA,
  CHAIN_ID_WORMCHAIN,
  cosmos,
} from '@certusone/wormhole-sdk';
import {
  CosmWasmClient,
  MsgExecuteContractEncodeObject,
} from '@cosmjs/cosmwasm-stargate';
import {
  Coin,
  IbcExtension,
  MsgTransferEncodeObject,
  QueryClient,
  calculateFee,
  logs as cosmosLogs,
  setupIbcExtension,
  IndexedTx,
} from '@cosmjs/stargate';
import {
  ChainId,
  ChainName,
  CosmosTransaction,
  TokenId,
  searchCosmosLogs,
  SolanaContext,
  WormholeContext,
  CosmosContext,
  getNativeDenom,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import {
  Tendermint34Client,
  Tendermint37Client,
  TendermintClient,
} from '@cosmjs/tendermint-rpc';
import { BigNumber, utils } from 'ethers';
import { getDisplayName } from 'utils';
import { arrayify, base58 } from 'ethers/lib/utils.js';
import { ParsedMessage, toChainId, wh } from 'utils/sdk';
import { isGatewayChain } from 'utils/cosmos';
import { CHAINS, ENV, RPCS, ROUTES, TOKENS } from 'config';
import { Route, TokenConfig } from 'config/types';
import {
  MAX_DECIMALS,
  getTokenDecimals,
  toNormalizedDecimals,
} from '../../utils';
import { toDecimals, toFixedDecimals } from '../../utils/balance';
import { TransferWallet, signAndSendTransaction } from '../../utils/wallet';
import { BaseRoute } from '../bridge/baseRoute';
import {
  RelayTransferMessage,
  SignedRelayTransferMessage,
  SignedTokenTransferMessage,
  TokenTransferMessage,
  TransferDisplayData,
  isSignedWormholeMessage,
  UnsignedMessage,
  SignedMessage,
  TransferDestInfoBaseParams,
  TransferInfoBaseParams,
} from '../types';
import { BridgeRoute } from '../bridge/bridge';
import { fetchVaa } from '../../utils/vaa';
import { formatGasFee } from '../utils';
import { adaptParsedMessage } from '../utils';

interface GatewayTransferMsg {
  gateway_transfer: {
    chain: ChainId;
    recipient: string;
    fee: string;
    nonce: number;
  };
}

interface FromCosmosPayload {
  gateway_ibc_token_bridge_payload: GatewayTransferMsg;
}

interface IBCTransferInfo {
  sequence: string;
  timeout: string;
  srcChannel: string;
  dstChannel: string;
  data: string;
}

interface IBCTransferData {
  amount: string;
  denom: string;
  memo: string;
  receiver: string;
  sender: string;
}

const IBC_MSG_TYPE = '/ibc.applications.transfer.v1.MsgTransfer';
const IBC_PORT = 'transfer';
const IBC_TIMEOUT_MILLIS = 10 * 60 * 1000; // 10 minutes

const millisToNano = (seconds: number) => seconds * 1_000_000;

export class CosmosGatewayRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;

  private static CLIENT_MAP: Record<string, TendermintClient> = {};

  isSupportedChain(chain: ChainName): boolean {
    return isGatewayChain(chain);
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(Route.CosmosGateway)) {
      return false;
    }

    return (
      isGatewayChain(wh.toChainId(sourceChain)) ||
      isGatewayChain(wh.toChainId(destChain))
    );
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    return sendAmount || 0;
  }

  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    return receiveAmount || 0;
  }

  async validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean> {
    throw new Error('not implemented');
  }

  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions?: any,
  ): Promise<BigNumber> {
    const gasFee = await wh.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      CHAIN_ID_WORMCHAIN,
      this.getTranslatorAddress(),
    );

    if (!gasFee) throw new Error('could not estimate gas fee');

    return gasFee;
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    if (!signedMessage)
      throw new Error('Cannot estimate gas without a signed message');
    throw new Error('not implemented');
  }

  private buildToCosmosPayload(
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

  async toCosmos(
    token: TokenId | 'native',
    amount: string,
    sendingChainId: ChainId,
    senderAddress: string,
    recipientChainId: ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<any> {
    const payload = this.buildToCosmosPayload(
      recipientChainId,
      recipientAddress,
    );

    const tx = await wh.send(
      token,
      amount,
      sendingChainId,
      senderAddress,
      CHAIN_ID_WORMCHAIN,
      this.getTranslatorAddress(),
      undefined,
      payload,
    );

    return signAndSendTransaction(
      wh.toChainName(sendingChainId),
      tx,
      TransferWallet.SENDING,
    );
  }

  private buildFromCosmosPayloadMemo(
    recipientChainId: ChainId,
    recipientAddress: string,
  ): string {
    const nonce = Math.round(Math.random() * 10000);

    const destContext = wh.getContext(recipientChainId);
    const recipient = Buffer.from(
      isGatewayChain(recipientChainId)
        ? recipientAddress
        : destContext.formatAddress(recipientAddress),
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

  async fromCosmos(
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

    const memo = this.buildFromCosmosPayloadMemo(recipientChainId, recipient);

    const denom = await this.getForeignAsset(token, sendingChainId);
    if (!denom) throw new Error('Could not derive IBC asset denom');
    const coin: Coin = {
      denom,
      amount,
    };
    const channel = await this.getIbcDestinationChannel(sendingChainId);
    const ibcMessage: MsgTransferEncodeObject = {
      typeUrl: IBC_MSG_TYPE,
      value: MsgTransfer.fromPartial({
        sourcePort: IBC_PORT,
        sourceChannel: channel,
        sender: senderAddress,
        receiver: this.getTranslatorAddress(),
        token: coin,
        timeoutTimestamp: millisToNano(Date.now() + IBC_TIMEOUT_MILLIS),
        memo,
      }),
    };

    const sendingChainName = wh.toChainName(sendingChainId);
    const gasDenom = getNativeDenom(sendingChainName, ENV);

    const tx: CosmosTransaction = {
      fee: calculateFee(1000000, `1.0${gasDenom}`),
      msgs: [ibcMessage],
      memo: '',
    };

    return signAndSendTransaction(sendingChainName, tx, TransferWallet.SENDING);
  }

  getForeignAsset(
    token: TokenId,
    chain: ChainId | ChainName,
  ): Promise<string | null> {
    return wh.getForeignAsset(token, chain);
  }

  getMinSendAmount(routeOptions: any): number {
    return 0;
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<any> {
    const sendingChainId = wh.toChainId(sendingChain);
    const recipientChainId = wh.toChainId(recipientChain);
    const decimals = getTokenDecimals(sendingChainId, token);
    const parsedAmt = utils.parseUnits(amount, decimals);

    if (isGatewayChain(sendingChainId)) {
      return this.fromCosmos(
        token,
        parsedAmt.toString(),
        sendingChainId,
        senderAddress,
        recipientChainId,
        recipientAddress,
        routeOptions,
      );
    }

    return this.toCosmos(
      token,
      parsedAmt.toString(),
      sendingChainId,
      senderAddress,
      recipientChainId,
      recipientAddress,
      routeOptions,
    );
  }

  private async manualRedeem(
    destChain: ChainName | ChainId,
    message: SignedMessage,
    recipient: string,
  ): Promise<string> {
    if (!isSignedWormholeMessage(message))
      throw new Error('Signed message is not for gateway');
    const vaa = Buffer.from(message.vaa).toString('base64');
    const msg: MsgExecuteContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        contract: this.getTranslatorAddress(),
        msg: Buffer.from(
          JSON.stringify({ complete_transfer_and_convert: { vaa } }),
        ),
      }),
    };

    const destChainName = wh.toChainName(destChain);
    const gasDenom = getNativeDenom(destChainName, ENV);

    const tx: CosmosTransaction = {
      fee: calculateFee(1000000, `1.0${gasDenom}`),
      msgs: [msg],
      memo: '',
    };

    return signAndSendTransaction(destChainName, tx, TransferWallet.RECEIVING);
  }

  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    const chain = wh.toChainId(destChain);

    if (isGatewayChain(chain)) {
      return this.manualRedeem(CHAIN_ID_WORMCHAIN, messageInfo, recipient);
    }

    // for non-cosmos chains, the redeem behavior is the same as the bridge route (manual)
    return new BridgeRoute().redeem(destChain, messageInfo, recipient);
  }

  async getPreview(
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    receipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const sendingChainName = wh.toChainName(sendingChain);
    const sourceGasToken = CHAINS[sendingChainName]?.gasToken;
    const sourceGasTokenSymbol = sourceGasToken
      ? getDisplayName(TOKENS[sourceGasToken])
      : '';
    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${amount}`, 6)} ${getDisplayName(
          destToken,
        )}`,
      },
      {
        title: 'Total fee estimates',
        value: `${sendingGasEst} ${sourceGasTokenSymbol}`,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst
              ? `~ ${sendingGasEst} ${sourceGasTokenSymbol}`
              : '—',
          },
        ],
      },
    ];
  }

  getTranslatorAddress(): string {
    const addr = CHAINS['wormchain']?.contracts.ibcShimContract;
    if (!addr) throw new Error('IBC Shim contract not configured');
    return addr;
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    return BigNumber.from(0);
  }

  async getIbcDestinationChannel(chain: ChainId | ChainName): Promise<string> {
    const sourceChannel = await this.getIbcSourceChannel(chain);
    const queryClient = await this.getQueryClient(CHAIN_ID_WORMCHAIN);
    const conn = await queryClient.ibc.channel.channel(IBC_PORT, sourceChannel);

    const destChannel = conn.channel?.counterparty?.channelId;
    if (!destChannel) {
      throw new Error(`No destination channel found on chain ${chain}`);
    }

    return destChannel;
  }

  async getIbcSourceChannel(chain: ChainId | ChainName): Promise<string> {
    const id = wh.toChainId(chain);
    if (!isGatewayChain(id)) throw new Error('Chain is not cosmos chain');
    const client = await this.getCosmWasmClient(CHAIN_ID_WORMCHAIN);
    const { channel } = await client.queryContractSmart(
      this.getTranslatorAddress(),
      {
        ibc_channel: {
          chain_id: id,
        },
      },
    );
    return channel;
  }

  private async getQueryClient(
    chain: ChainId | ChainName,
  ): Promise<QueryClient & IbcExtension> {
    const tmClient = await this.getTmClient(chain);
    return QueryClient.withExtensions(tmClient, setupIbcExtension);
  }

  private async getTmClient(
    chain: ChainId | ChainName,
  ): Promise<Tendermint34Client | Tendermint37Client> {
    const name = wh.toChainName(chain);
    if (CosmosGatewayRoute.CLIENT_MAP[name]) {
      return CosmosGatewayRoute.CLIENT_MAP[name];
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

    CosmosGatewayRoute.CLIENT_MAP[name] = tmClient;

    return tmClient;
  }

  private async getCosmWasmClient(
    chain: ChainId | ChainName,
  ): Promise<CosmWasmClient> {
    const tmClient = await this.getTmClient(chain);
    return CosmWasmClient.create(tmClient);
  }

  async isTransferCompleted(
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedWormholeMessage(message))
      throw new Error('Signed message is not for gateway');

    if (!isGatewayChain(destChain)) {
      return new BridgeRoute().isTransferCompleted(destChain, message);
    }

    const destTx = await this.fetchRedeemTx(message);
    return !!destTx;
  }

  async getMessage(
    hash: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const name = wh.toChainName(chain);
    return isGatewayChain(name)
      ? this.getMessageFromCosmos(hash, name)
      : this.getMessageFromNonCosmos(hash, name);
  }

  async getSignedMessage(
    message: TokenTransferMessage | RelayTransferMessage,
  ): Promise<SignedTokenTransferMessage | SignedRelayTransferMessage> {
    // if both chains are cosmos gateway chains, no vaa is emitted
    if (
      isGatewayChain(message.fromChain) &&
      isGatewayChain(message.toChain)
    ) {
      return {
        ...message,
        vaa: '',
      };
    }

    const vaa = await fetchVaa({
      ...message,
      // transfers from cosmos vaas are emitted by wormchain and not by the source chain
      fromChain: isGatewayChain(message.fromChain)
        ? 'wormchain'
        : message.fromChain,
    });

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...message,
      vaa: utils.hexlify(vaa.bytes),
    };
  }

  async getMessageFromNonCosmos(
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

  async getMessageFromCosmos(
    hash: string,
    chain: ChainName,
  ): Promise<UnsignedMessage> {
    // Get tx on the source chain (e.g. osmosis)
    const sourceClient = await this.getCosmWasmClient(chain);
    const tx = await sourceClient.getTx(hash);
    if (!tx) {
      throw new Error(`Transaction ${hash} not found on chain ${chain}`);
    }

    const logs = cosmosLogs.parseRawLog(tx.rawLog);
    const sender = searchCosmosLogs('sender', logs);
    if (!sender) throw new Error('Missing sender in transaction logs');

    // Extract IBC transfer info initiated on the source chain
    const ibcInfo = this.getIBCTransferInfoFromLogs(tx, 'send_packet');

    // Look for the matching IBC receive on wormchain
    // The IBC hooks middleware will execute the translator contract
    // and include the execution logs on the transaction
    // which can be used to extract the VAA
    const destTx = await this.findDestinationIBCTransferTx(
      CHAIN_ID_WORMCHAIN,
      ibcInfo,
    );
    if (!destTx) {
      throw new Error(
        `No wormchain transaction found for packet on chain ${chain}`,
      );
    }

    // TODO: refactor these two lines (repeated in parseWormchainIBCForwardMessage)
    const data: IBCTransferData = JSON.parse(ibcInfo.data);
    const payload: FromCosmosPayload = JSON.parse(data.memo);
    const parsed = await (isGatewayChain(
      payload.gateway_ibc_token_bridge_payload.gateway_transfer.chain,
    )
      ? this.parseWormchainIBCForwardMessage(destTx)
      : this.parseWormchainBridgeMessage(destTx));

    return {
      ...parsed,
      // add the original source chain and tx hash to the info
      // the vaa contains only the wormchain information
      fromChain: wh.toChainName(chain),
      sendTx: hash,
      sender,
    };
  }

  private async parseWormchainBridgeMessage(
    wormchainTx: IndexedTx,
  ): Promise<ParsedMessage> {
    const message = await wh.getMessage(wormchainTx.hash, CHAIN_ID_WORMCHAIN);
    return adaptParsedMessage(message);
  }

  private async parseWormchainIBCForwardMessage(
    wormchainTx: IndexedTx,
  ): Promise<ParsedMessage> {
    // get the information of the ibc transfer relayed by the packet forwarding middleware
    const ibcFromSourceInfo = this.getIBCTransferInfoFromLogs(
      wormchainTx,
      'recv_packet',
    );

    const data: IBCTransferData = JSON.parse(ibcFromSourceInfo.data);
    const payload: FromCosmosPayload = JSON.parse(data.memo);

    const destChain = wh.toChainName(
      payload.gateway_ibc_token_bridge_payload.gateway_transfer.chain,
    );
    const ibcToDestInfo = this.getIBCTransferInfoFromLogs(
      wormchainTx,
      'send_packet',
    );
    const destTx = await this.findDestinationIBCTransferTx(
      destChain,
      ibcToDestInfo,
    );
    if (!destTx) {
      throw new Error(`Transaction on destination ${destChain} not found`);
    }

    // transfer ibc denom follows the scheme {port}/{channel}/{denom}
    // with denom as {tokenfactory}/{ibc shim}/{bas58 cw20 address}
    // so 5 elements total
    const parts = data.denom.split('/');
    if (parts.length !== 5) {
      throw new Error(`Unexpected transfer denom ${data.denom}`);
    }
    const denom = parts.slice(2).join('/');
    const cw20 = this.factoryToCW20(denom);
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

    return adaptParsedMessage({
      fromChain: wh.toChainName(CHAIN_ID_WORMCHAIN), // gets replaced later
      sendTx: wormchainTx.hash, // gets replaced later
      toChain: destChain,
      amount: BigNumber.from(data.amount),
      recipient: data.receiver,
      block: destTx.height,
      sender: data.sender,
      gasFee: BigNumber.from(destTx.gasUsed.toString()),
      payloadID: 3, // should not be required for this case
      tokenChain,
      tokenAddress,
      tokenId: {
        address: tokenAddress,
        chain: tokenChain,
      },
      emitterAddress: '',
      sequence: BigNumber.from(0),
    });
  }

  private factoryToCW20(denom: string): string {
    if (!denom.startsWith('factory/')) return '';
    const encoded = denom.split('/')[2];
    if (!encoded) return '';
    return cosmos.humanAddress('wormhole', base58.decode(encoded));
  }

  async fetchRedeemTx(message: SignedMessage): Promise<string | null> {
    if (!isSignedWormholeMessage(message)) {
      throw new Error('Signed message is not for gateway');
    }

    return isGatewayChain(message.fromChain)
      ? await this.fetchRedeemedEventCosmosSource(message)
      : await this.fetchRedeemedEventNonCosmosSource(message);
  }

  private async fetchRedeemedEventNonCosmosSource(
    message: SignedTokenTransferMessage | SignedRelayTransferMessage,
  ): Promise<string | null> {
    const wormchainClient = await this.getCosmWasmClient(CHAIN_ID_WORMCHAIN);
    if (!message.payload) {
      throw new Error('Missing payload from transfer');
    }

    // find the transaction on wormchain based on the gateway transfer payload
    // since it has a nonce, we can assume it will be unique
    const txs = await wormchainClient.searchTx([
      { key: 'wasm.action', value: 'complete_transfer_with_payload' },
      { key: 'wasm.recipient', value: this.getTranslatorAddress() },
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
    const ibcInfo = this.getIBCTransferInfoFromLogs(txs[0], 'send_packet');

    // find the transaction on the target chain based on the ibc transfer info
    const destTx = await this.findDestinationIBCTransferTx(
      message.toChain,
      ibcInfo,
    );
    if (!destTx) {
      throw new Error(
        `No redeem transaction found on chain ${message.toChain}`,
      );
    }
    return destTx.hash;
  }

  private getIBCTransferInfoFromLogs(
    tx: IndexedTx,
    event: 'send_packet' | 'recv_packet',
  ): IBCTransferInfo {
    const logs = cosmosLogs.parseRawLog(tx.rawLog);
    const packetSeq = searchCosmosLogs(`${event}.packet_sequence`, logs);
    const packetTimeout = searchCosmosLogs(
      `${event}.packet_timeout_timestamp`,
      logs,
    );
    const packetSrcChannel = searchCosmosLogs(
      `${event}.packet_src_channel`,
      logs,
    );
    const packetDstChannel = searchCosmosLogs(
      `${event}.packet_dst_channel`,
      logs,
    );
    const packetData = searchCosmosLogs(`${event}.packet_data`, logs);
    if (
      !packetSeq ||
      !packetTimeout ||
      !packetSrcChannel ||
      !packetDstChannel ||
      !packetData
    ) {
      throw new Error('Missing packet information in transaction logs');
    }
    return {
      sequence: packetSeq,
      timeout: packetTimeout,
      srcChannel: packetSrcChannel,
      dstChannel: packetDstChannel,
      data: packetData,
    };
  }

  private async findDestinationIBCTransferTx(
    destChain: ChainName | ChainId,
    ibcInfo: IBCTransferInfo,
  ): Promise<IndexedTx | undefined> {
    const wormchainClient = await this.getCosmWasmClient(destChain);
    const destTx = await wormchainClient.searchTx([
      { key: 'recv_packet.packet_sequence', value: ibcInfo.sequence },
      { key: 'recv_packet.packet_timeout_timestamp', value: ibcInfo.timeout },
      { key: 'recv_packet.packet_src_channel', value: ibcInfo.srcChannel },
      { key: 'recv_packet.packet_dst_channel', value: ibcInfo.dstChannel },
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

  private async fetchRedeemedEventCosmosSource(
    message: SignedTokenTransferMessage | SignedRelayTransferMessage,
  ): Promise<string | null> {
    if (!isGatewayChain(message.toChain)) {
      return (await new BridgeRoute().tryFetchRedeemTx(message)) || null;
    }

    // find tx in the source chain and extract the ibc transfer to wormchain
    const sourceClient = await this.getCosmWasmClient(message.fromChain);
    const tx = await sourceClient.getTx(message.sendTx);
    if (!tx) return null;
    const sourceIbcInfo = this.getIBCTransferInfoFromLogs(tx, 'send_packet');

    // find tx in the ibc receive in wormchain and extract the ibc transfer to the dest tx
    const wormchainTx = await this.findDestinationIBCTransferTx(
      CHAIN_ID_WORMCHAIN,
      sourceIbcInfo,
    );
    if (!wormchainTx) return null;
    const wormchainToDestIbcInfo = this.getIBCTransferInfoFromLogs(
      wormchainTx,
      'send_packet',
    );

    // find the tx that deposits the funds in the final recipient
    const destTx = await this.findDestinationIBCTransferTx(
      message.toChain,
      wormchainToDestIbcInfo,
    );
    if (!destTx) return null;
    return destTx.hash;
  }

  async getTransferSourceInfo({
    txData,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenKey } = CHAINS[txData.fromChain]!;
    const sourceGasToken = TOKENS[sourceGasTokenKey];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeChain),
      'native',
    );
    const formattedGas =
      txData.gasFee && toDecimals(txData.gasFee, decimals, MAX_DECIMALS);
    const token = TOKENS[txData.tokenKey];

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas
          ? `${formattedGas} ${getDisplayName(sourceGasToken)}`
          : '—',
      },
    ];
  }

  async getTransferDestInfo({
    txData,
    receiveTx,
    gasEstimate,
  }: TransferDestInfoBaseParams): Promise<TransferDisplayData> {
    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

    let gas = gasEstimate;
    if (receiveTx) {
      const gasFee = await wh.getTxGasFee(txData.toChain, receiveTx);
      if (gasFee) {
        gas = formatGasFee(txData.toChain, gasFee);
      }
    }

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${getDisplayName(token)}`,
      },
      {
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${getDisplayName(TOKENS[gasToken])}` : '—',
      },
    ];
  }

  nativeTokenAmount(
    destChain: ChainId | ChainName,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Native gas drop-off not supported by this route');
  }

  maxSwapAmount(
    destChain: ChainId | ChainName,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Native gas drop-off not supported by this route');
  }

  async tryFetchRedeemTx(txData: SignedMessage): Promise<string | undefined> {
    const hash = await this.fetchRedeemTx(txData);
    return hash || undefined;
  }
}
