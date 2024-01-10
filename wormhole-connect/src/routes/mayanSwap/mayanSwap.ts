import {
  TokenId,
  ChainName,
  ChainId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BaseRoute } from '../bridge/baseRoute';
import { BigNumber } from 'ethers';
import { SignedMessage, UnsignedMessage } from 'routes/types';
import { Route, TokenConfig } from 'config/types';
import { ParsedMessage, ParsedRelayerMessage } from 'utils/sdk';
import { SUPPORTED_CHAINS, isTokenSupported } from './utils';

export class MayanSwap extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.mayanSwap;

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return true;
  }

  isSupportedChain(chain: ChainName): boolean {
    return SUPPORTED_CHAINS.includes(chain);
  }

  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain: ChainName | ChainId | undefined,
  ): Promise<boolean> {
    if (!token || !destToken || !sourceChain) return false;

    return isTokenSupported(sourceChain, token);
  }

  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    return true;
  }

  async computeReceiveAmount(
    sendAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    return 0;
  }

  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    return 0;
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
    return true;
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
    throw new Error('not implemented');
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage | undefined,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
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
  ): Promise<any> {}

  // TODO I dont think this is supported???
  async redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    throw new Error('not implemented');
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    throw new Error('not implemented');
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    throw new Error('not implemented');
  }

  async getSignedMessage(message: UnsignedMessage): Promise<SignedMessage> {
    throw new Error('not implemented');
  }

  async tryFetchRedeemTx(
    txData: ParsedMessage | ParsedRelayerMessage,
  ): Promise<string | undefined> {
    throw new Error('not implemented');
  }
}
