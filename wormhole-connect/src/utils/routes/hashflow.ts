import {
  ChainName,
  ChainId,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from '../../config/types';
import RouteAbstract, {
  TransferInfoBaseParams,
  MessageInfo,
} from './routeAbstract';
import { ParsedMessage, ParsedRelayerMessage } from '../sdk';
import { TransferDisplayData } from './types';
import { BigNumber } from 'ethers';

export class HashflowRoute extends RouteAbstract {
  public isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  public isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  public isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  public supportedSourceTokens(tokens: TokenConfig[]): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  public supportedDestTokens(tokens: TokenConfig[]): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  public computeReceiveAmount(sendAmount: number | undefined): Promise<number> {
    throw new Error('Method not implemented');
  }
  public computeSendAmount(receiveAmount: number | undefined): Promise<number> {
    throw new Error('Method not implemented');
  }
  public validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  public estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
  public estimateClaimGas(destChain: ChainName | ChainId): Promise<string> {
    throw new Error('Method not implemented.');
  }
  public send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public redeem(
    destChain: ChainName | ChainId,
    messageInfo: MessageInfo,
    recipient: string,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
  public parseMessage(
    messageInfo: MessageInfo,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    throw new Error('Method not implemented.');
  }
  public getPreview<P>(params: P): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }
  public getNativeBalance(
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    throw new Error('Method not implemented.');
  }
  public getTokenBalance(
    address: string,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    throw new Error('Method not implemented.');
  }
  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }
  getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    throw new Error('Method not implemented.');
  }
  isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: MessageInfo,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getMessageInfo(tx: string, chain: ChainName | ChainId): Promise<MessageInfo> {
    throw new Error('Method not implemented.');
  }
  getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }
  getTransferDestInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }

  async nativeTokenAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Not implemented');
  }

  async maxSwapAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    throw new Error('Not implemented');
  }
}
