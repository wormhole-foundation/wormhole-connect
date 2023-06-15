import {
  TokenId,
  ChainName,
  ChainId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';

export default abstract class RouteAbstract {
  // protected abstract sendGasFallback: { [key: ChainName]: TokenConfig };
  // protected abstract claimGasFallback: { [key: ChainName]: TokenConfig };

  protected abstract isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean>;

  protected abstract isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean>;
  protected abstract isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean>;

  protected abstract supportedSourceTokens(
    tokens: TokenConfig[],
  ): Promise<TokenConfig[]>;
  protected abstract supportedDestTokens(
    tokens: TokenConfig[],
  ): Promise<TokenConfig[]>;

  protected abstract validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean>;

  protected abstract estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string>;

  protected abstract estimateClaimGas(
    destChain: ChainName | ChainId,
  ): Promise<string>;

  /**
   * These operations have to be implemented in subclasses.
   */
  protected abstract send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<any>;

  protected abstract parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): any;

  // send, validate, estimate gas, isRouteAvailable, parse data from VAA/fetch data, claim
}
