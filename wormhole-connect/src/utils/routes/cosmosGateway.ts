import {
  CHAIN_ID_OSMOSIS,
  CHAIN_ID_SEI,
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
} from '@cosmjs/stargate';
import {
  ChainId,
  ChainName,
  CosmosTransaction,
  TokenId,
  searchCosmosLogs,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import {
  Tendermint34Client,
  Tendermint37Client,
  TendermintClient,
} from '@cosmjs/tendermint-rpc';
import { BigNumber, utils } from 'ethers';
import { arrayify, base58, hexlify } from 'ethers/lib/utils.js';
import { toChainId, wh } from 'utils/sdk';
import { isCosmWasmChain } from 'utils/cosmos';
import { CHAINS, RPCS, ROUTES, TOKENS } from 'config';
import { Route, TokenConfig } from 'config/types';
import { MAX_DECIMALS, getTokenDecimals, toNormalizedDecimals } from '..';
import { toDecimals, toFixedDecimals } from '../balance';
import { TransferWallet, signAndSendTransaction } from '../wallet';
import { BaseRoute } from './baseRoute';
import { adaptParsedMessage } from './common';
import {
  RelayTransferMessage,
  SignedRelayTransferMessage,
  SignedTokenTransferMessage,
  TokenTransferMessage,
  TransferDisplayData,
  isSignedWormholeMessage,
} from './types';
import {
  UnsignedMessage,
  SignedMessage,
  TransferDestInfoBaseParams,
  TransferInfoBaseParams,
} from './types';
import { BridgeRoute } from './bridge';
import { fetchVaa } from '../vaa';
import { formatGasFee } from './utils';
import { estimateClaimGas } from 'utils/gas';

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

const IBC_MSG_TYPE = '/ibc.applications.transfer.v1.MsgTransfer';
const IBC_PORT = 'transfer';
const IBC_TIMEOUT_MILLIS = 10 * 60 * 1000; // 10 minutes

const millisToNano = (seconds: number) => seconds * 1_000_000;

export class CosmosGatewayRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;

  private static CLIENT_MAP: Record<string, TendermintClient> = {};

  isSupportedChain(chain: ChainName): boolean {
    return isCosmWasmChain(chain);
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
      isCosmWasmChain(wh.toChainId(sourceChain)) ||
      isCosmWasmChain(wh.toChainId(destChain))
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
    VAA?: Uint8Array,
  ): Promise<BigNumber> {
    if (!VAA) throw new Error('Cannot estimate gas without signedVAA');
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

    if (isCosmWasmChain(sendingChainId)) {
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

    const tx: CosmosTransaction = {
      fee: calculateFee(1000000, '1.0uosmo'),
      msgs: [msg],
      memo: '',
    };

    return signAndSendTransaction(
      wh.toChainName(destChain),
      tx,
      TransferWallet.RECEIVING,
    );
  }

  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    const chain = wh.toChainId(destChain);

    if (isCosmWasmChain(chain)) {
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

    return [
      {
        title: 'Amount',
        value: `${toFixedDecimals(`${amount}`, 6)} ${destToken.symbol}`,
      },
      {
        title: 'Total fee estimates',
        value: `${sendingGasEst} ${sourceGasToken}`,
        rows: [
          {
            title: 'Source chain gas estimate',
            value: sendingGasEst ? `~ ${sendingGasEst} ${sourceGasToken}` : '—',
          },
        ],
      },
    ];
  }

  async getNativeBalance(
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    return wh.getNativeBalance(address, network);
  }

  async getTokenBalance(
    address: string,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    if (isCosmWasmChain(wh.toChainId(network))) {
      const denom = await this.getForeignAsset(tokenId, network);
      if (!denom) return null;
      return wh.getNativeBalance(address, network, denom);
    }

    return wh.getTokenBalance(address, tokenId, network);
  }

  private isNativeDenom(denom: string, network: ChainName | ChainId): boolean {
    const chainId = wh.toChainId(network);
    switch (chainId) {
      case CHAIN_ID_SEI:
        return denom === 'usei';
      case CHAIN_ID_WORMCHAIN:
        return denom === 'uworm';
      case CHAIN_ID_OSMOSIS:
        return denom === 'uosmo';
      default:
        return false;
    }
  }

  private CW20AddressToFactory(address: string): string {
    const encodedAddress = base58.encode(cosmos.canonicalAddress(address));
    return `factory/${this.getTranslatorAddress()}/${encodedAddress}`;
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

  async getForeignAsset(
    tokenId: TokenId,
    chain: ChainId | ChainName,
  ): Promise<string | null> {
    // fall back to original implementation if not cosmos chain
    if (!isCosmWasmChain(wh.toChainId(chain))) {
      return wh.getForeignAsset(tokenId, chain);
    }

    // add check here in case the token is a native cosmos denom
    // in such cases there's no need to look for in the wormchain network
    if (tokenId.chain === chain) return tokenId.address;
    const wrappedAsset = await wh.getForeignAsset(tokenId, CHAIN_ID_WORMCHAIN);
    if (!wrappedAsset) return null;
    return this.isNativeDenom(wrappedAsset, chain)
      ? wrappedAsset
      : this.deriveIBCDenom(this.CW20AddressToFactory(wrappedAsset), chain);
  }

  async deriveIBCDenom(
    denom: string,
    chain: ChainId | ChainName,
  ): Promise<string | null> {
    const channel = await this.getIbcDestinationChannel(chain);
    const hashData = utils.hexlify(Buffer.from(`transfer/${channel}/${denom}`));
    const hash = utils.sha256(hashData).substring(2);
    return `ibc/${hash.toUpperCase()}`;
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
    if (!isCosmWasmChain(id)) throw new Error('Chain is not cosmos chain');
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

  isTransferCompleted(
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    if (!isSignedWormholeMessage(message))
      throw new Error('Signed message is not for gateway');
    return isCosmWasmChain(destChain)
      ? wh.isTransferCompleted(CHAIN_ID_WORMCHAIN, hexlify(message.vaa))
      : new BridgeRoute().isTransferCompleted(destChain, message);
  }

  async getMessage(
    hash: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const name = wh.toChainName(chain);
    return isCosmWasmChain(name)
      ? this.getMessageFromCosmos(hash, name)
      : this.getMessageFromNonCosmos(hash, name);
  }

  async getSignedMessage(
    message: TokenTransferMessage | RelayTransferMessage,
  ): Promise<SignedTokenTransferMessage | SignedRelayTransferMessage> {
    const vaa = await fetchVaa({
      ...message,
      // transfers from cosmos vaas are emitted by wormchain and not by the source chain
      fromChain: isCosmWasmChain(message.fromChain)
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

    // Extract IBC transfer info initiated on the source chain
    const logs = cosmosLogs.parseRawLog(tx.rawLog);
    const packetSeq = searchCosmosLogs('packet_sequence', logs);
    const packetTimeout = searchCosmosLogs('packet_timeout_timestamp', logs);
    const packetSrcChannel = searchCosmosLogs('packet_src_channel', logs);
    const packetDstChannel = searchCosmosLogs('packet_dst_channel', logs);
    if (
      !packetSeq ||
      !packetTimeout ||
      !packetSrcChannel ||
      !packetDstChannel
    ) {
      throw new Error('Missing packet information in transaction logs');
    }

    // Look for the matching IBC receive on wormchain
    // The IBC hooks middleware will execute the translator contract
    // and include the execution logs on the transaction
    // which can be used to extract the VAA
    const wormchainClient = await this.getCosmWasmClient(CHAIN_ID_WORMCHAIN);
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

  async getTransferSourceInfo({
    txData,
  }: TransferInfoBaseParams): Promise<TransferDisplayData> {
    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    const { gasToken: sourceGasTokenSymbol } = CHAINS[txData.fromChain]!;
    const sourceGasToken = TOKENS[sourceGasTokenSymbol];
    const decimals = getTokenDecimals(
      toChainId(sourceGasToken.nativeNetwork),
      sourceGasToken.tokenId,
    );
    const formattedGas =
      txData.gasFee && toDecimals(txData.gasFee, decimals, MAX_DECIMALS);
    const token = TOKENS[txData.tokenKey];

    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas ? `${formattedGas} ${sourceGasTokenSymbol}` : '—',
      },
    ];
  }

  async getTransferDestInfo({
    txData,
    receiveTx,
  }: TransferDestInfoBaseParams): Promise<TransferDisplayData> {
    const token = TOKENS[txData.tokenKey];
    const { gasToken } = CHAINS[txData.toChain]!;

    let gas: string = '';
    if (receiveTx) {
      const gasUsed = await wh.getTxGasUsed(txData.toChain, receiveTx);
      if (gasUsed) {
        gas = formatGasFee(txData.toChain, gasUsed);
      }
    } else {
      gas = await estimateClaimGas(Route.CosmosGateway, txData.toChain);
    }

    const formattedAmt = toNormalizedDecimals(
      txData.amount,
      txData.tokenDecimals,
      MAX_DECIMALS,
    );
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${gasToken}` : '—',
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
}
