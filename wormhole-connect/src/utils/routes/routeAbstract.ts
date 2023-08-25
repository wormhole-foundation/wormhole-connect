import {
  TokenId,
  ChainName,
  ChainId,
  VaaInfo,
  CCTPInfo,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import { ParsedMessage, ParsedRelayerMessage } from '../sdk';
import { TransferDisplayData } from './types';
import { BigNumber } from 'ethers';

// As more routes are added, more types should be added here (e.g. MessageInfo = ParsedVaa | DifferentRouteInfoStruct | ..)
// This struct contains information needed to redeem the transfer
export type MessageInfo = VaaInfo | CCTPInfo;

export interface TransferInfoBaseParams {
  txData: ParsedMessage | ParsedRelayerMessage;
}

export default abstract class RouteAbstract {
  // protected abstract sendGasFallback: { [key: ChainName]: TokenConfig };
  // protected abstract claimGasFallback: { [key: ChainName]: TokenConfig };

  // Is this route available for the given network, token and amount specifications?
  public abstract isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean>;

  public abstract isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean>;
  public abstract isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean>;

  public abstract supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
  ): Promise<TokenConfig[]>;
  public abstract supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken?: TokenConfig,
  ): Promise<TokenConfig[]>;

  // Calculate the amount a user would receive if sending a certain amount
  public abstract computeReceiveAmount(
    sendAmount: number | undefined,
    routeOptions: any,
  ): Promise<number>;
  // Calculate the amount a user would need to send in order to receive a certain amount
  public abstract computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number>;

  // Validate a transfer before sending via the chosen route
  public abstract validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean>;

  // estimate send gas fees
  public abstract estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string>;

  // estimate claim gas fees, return 0 if none
  public abstract estimateClaimGas(
    destChain: ChainName | ChainId,
  ): Promise<string>;

  /**
   * These operations have to be implemented in subclasses.
   */
  public abstract send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<any>;

  public abstract parseMessage(
    messageInfo: MessageInfo,
  ): Promise<ParsedMessage | ParsedRelayerMessage>;

  public abstract redeem(
    destChain: ChainName | ChainId,
    messageInfo: MessageInfo,
    recipient: string,
  ): Promise<string>;

  public abstract getPreview(params: any): Promise<TransferDisplayData>;
  public abstract getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData>;
  public abstract getTransferDestInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData>;

  // send, validate, estimate gas, isRouteAvailable, parse data from VAA/fetch data, claim

  abstract getNativeBalance(
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null>;
  abstract getTokenBalance(
    address: string,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null>;

  abstract getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber>;

  abstract getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null>;

  abstract getMessageInfo(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<MessageInfo>;

  abstract isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: MessageInfo,
  ): Promise<boolean>;
}
