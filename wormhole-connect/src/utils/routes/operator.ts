import {
  ChainName,
  ChainId,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Route } from 'store/transferInput';
import { BridgeRoute } from './bridge';
import { RelayRoute } from './relay';
import { HashflowRoute } from './hashflow';
import { TokenConfig } from 'config/types';
import {
  ParsedMessage,
  ParsedRelayerMessage,
  PayloadType,
  getVaa,
} from '../sdk';
import RouteAbstract, {
  TransferInfoBaseParams,
  MessageInfo,
} from './routeAbstract';
import {
  CHAIN_ID_SEI,
  parseTokenTransferPayload,
} from '@certusone/wormhole-sdk';
import { TransferDisplayData } from './types';
import { BigNumber } from 'ethers';

export default class Operator {
  getRoute(route: Route): RouteAbstract {
    switch (route) {
      case Route.BRIDGE: {
        return new BridgeRoute();
      }
      case Route.RELAY: {
        return new RelayRoute();
      }
      case Route.HASHFLOW: {
        return new HashflowRoute();
      }
      default: {
        throw new Error('Not a valid route');
      }
    }
  }

  async getRouteFromTx(txHash: string, chain: ChainName): Promise<Route> {
    const result = await getVaa(txHash, chain);
    const vaa = result.vaa;

    // if(HASHFLOW_CONTRACT_ADDRESSES.includes(vaa.emitterAddress)) {
    //   return Route.HASHFLOW
    // }

    // if(CCTP_CONTRACT_ADDRESSES.includes(vaa.emitterAddress)) {
    //   return Route.CCTP
    // }

    const transfer = parseTokenTransferPayload(vaa.payload);
    if (transfer.toChain === CHAIN_ID_SEI) {
      return Route.RELAY;
    }

    return vaa.payload && vaa.payload[0] === PayloadType.AUTOMATIC
      ? Route.RELAY
      : Route.BRIDGE;
  }

  async isRouteAvailable(
    route: Route,
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.isRouteAvailable(
      sourceToken,
      destToken,
      amount,
      sourceChain,
      destChain,
    );
  }

  async isSupportedSourceToken(
    route: Route,
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.isSupportedSourceToken(token, destToken);
  }

  async isSupportedDestToken(
    route: Route,
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.isSupportedDestToken(token, sourceToken);
  }

  async supportedSourceTokens(
    route: Route,
    tokens: TokenConfig[],
    destToken?: TokenConfig,
  ): Promise<TokenConfig[]> {
    const r = this.getRoute(route);
    return await r.supportedSourceTokens(tokens, destToken);
  }

  async supportedDestTokens(
    route: Route,
    tokens: TokenConfig[],
    sourceToken?: TokenConfig,
  ): Promise<TokenConfig[]> {
    const r = this.getRoute(route);
    return await r.supportedDestTokens(tokens, sourceToken);
  }

  async computeReceiveAmount(
    route: Route,
    sendAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmount(sendAmount, routeOptions);
  }
  async computeSendAmount(
    route: Route,
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeSendAmount(receiveAmount, routeOptions);
  }

  async validate(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.validate(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
  }

  async estimateSendGas(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string> {
    const r = this.getRoute(route);
    return await r.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
  }

  async estimateClaimGas(
    route: Route,
    destChain: ChainName | ChainId,
  ): Promise<string> {
    const r = this.getRoute(route);
    return await r.estimateClaimGas(destChain);
  }

  async send(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string> {
    const r = this.getRoute(route);
    return await r.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
  }

  async redeem(
    route: Route,
    destChain: ChainName | ChainId,
    messageInfo: MessageInfo,
    payer: string,
  ): Promise<string> {
    const r = this.getRoute(route);
    return await r.redeem(destChain, messageInfo, payer);
  }

  async parseMessage(
    route: Route,
    info: MessageInfo,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    const r = this.getRoute(route);
    return await r.parseMessage(info);
  }

  async getPreview(route: Route, params: any): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return await r.getPreview(params);
  }

  public async getNativeBalance(
    route: Route,
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const r = this.getRoute(route);
    return r.getNativeBalance(address, network);
  }

  public async getTokenBalance(
    route: Route,
    address: string,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const r = this.getRoute(route);
    return r.getTokenBalance(address, tokenId, network);
  }

  public async getRelayerFee(
    route: Route,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return r.getRelayerFee(sourceChain, destChain, token);
  }

  public async getForeignAsset(
    route: Route,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<string | null> {
    const r = this.getRoute(route);
    return r.getForeignAsset(tokenId, network);
  }

  public async isTransferCompleted(
    route: Route,
    destChain: ChainName | ChainId,
    messageInfo: MessageInfo,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return r.isTransferCompleted(destChain, messageInfo);
  }

  public async getMessageInfo(
    route: Route,
    tx: string,
    network: ChainName | ChainId,
  ): Promise<MessageInfo> {
    const r = this.getRoute(route);
    return r.getMessageInfo(tx, network);
  }

  public getTransferSourceInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return r.getTransferSourceInfo(params);
  }

  public getTransferDestInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return r.getTransferDestInfo(params);
  }
}
