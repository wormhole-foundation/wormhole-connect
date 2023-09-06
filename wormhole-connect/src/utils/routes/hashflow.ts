import {
  ChainName,
  ChainId,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';

import { TokenConfig } from 'config/types';
import {
  TransferInfoBaseParams,
  UnsignedMessage,
  SignedMessage,
} from './types';
import { TransferDisplayData } from './types';
import RouteAbstract from './routeAbstract';

export class HashflowRoute extends RouteAbstract {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED = false;
  readonly AUTOMATIC_DEPOSIT = true;

  isSupportedChain(chain: ChainName): boolean {
    return false;
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    // if (!ROUTES.includes(Route.Hashflow)) {
    //   return false;
    // }

    throw new Error('Method not implemented.');
  }
  isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  supportedSourceTokens(tokens: TokenConfig[]): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  supportedDestTokens(tokens: TokenConfig[]): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  computeReceiveAmount(sendAmount: number | undefined): Promise<number> {
    throw new Error('Method not implemented');
  }
  computeSendAmount(receiveAmount: number | undefined): Promise<number> {
    throw new Error('Method not implemented');
  }
  validate(
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
  estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }
  estimateClaimGas(
    destChain: ChainName | ChainId,
    VAA: Uint8Array,
  ): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }
  getMinSendAmount(routeOptions: any): number {
    return 0;
  }
  send(
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
  redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
  public getPreview<P>(params: P): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }
  getNativeBalance(
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    throw new Error('Method not implemented.');
  }
  getTokenBalance(
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
    message: SignedMessage,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  getMessage(tx: string, chain: ChainName | ChainId): Promise<UnsignedMessage> {
    throw new Error('Method not implemented.');
  }
  getSignedMessage(message: UnsignedMessage): Promise<SignedMessage> {
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
