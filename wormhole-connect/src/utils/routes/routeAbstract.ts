import { SignedVaa } from '@certusone/wormhole-sdk';
import {
  TokenId,
  ChainName,
  ChainId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import { ParsedMessage, ParsedRelayerMessage } from '../sdk';

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
  ): Promise<TokenConfig[]>;
  public abstract supportedDestTokens(
    tokens: TokenConfig[],
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

  public abstract parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): any;

  public abstract parseMessage(
    sourceTx: string,
    vaa: SignedVaa,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage | ParsedRelayerMessage>;

  public abstract redeem(
    destChain: ChainName | ChainId,
    vaa: Uint8Array,
    recipient: string,
  ): Promise<string>;

  // send, validate, estimate gas, isRouteAvailable, parse data from VAA/fetch data, claim
}
