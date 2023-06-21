import {
  TokenId,
  ChainName,
  ChainId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';

export default abstract class RouteAbstract {
  // protected abstract sendGasFallback: { [key: ChainName]: TokenConfig };
  // protected abstract claimGasFallback: { [key: ChainName]: TokenConfig };

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

  public abstract validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean>;

  public abstract estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string>;

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

  public abstract redeem(
    destChain: ChainName | ChainId,
    vaa: Uint8Array,
    recipient: string,
  ): Promise<string>;

  // send, validate, estimate gas, isRouteAvailable, parse data from VAA/fetch data, claim
}
