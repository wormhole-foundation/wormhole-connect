import {
  ChainName,
  ChainId,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from '../../config/types';
import RouteAbstract from './routeAbstract';
import { ParsedMessage, ParsedRelayerMessage } from '../sdk';
import { PreviewData } from './types';

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

  public readyForRedeem(
    txData: ParsedMessage | ParsedRelayerMessage,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public redeem(txData: ParsedMessage | ParsedRelayerMessage): Promise<string> {
    throw new Error('Method not implemented.');
  }
  public parseMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage | ParsedRelayerMessage> {
    throw new Error('Method not implemented.');
  }

  public async isTransferCompleted(
    txData: ParsedMessage | ParsedRelayerMessage,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public getPreview<P>(params: P): Promise<PreviewData> {
    throw new Error('Method not implemented.');
  }
}
