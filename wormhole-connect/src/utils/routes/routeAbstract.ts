import {
  TokenId,
  ChainName,
  ChainId,
} from '@wormhole-foundation/wormhole-connect-sdk';

export abstract class RouteAbstract<TransactionResult> {
  protected abstract gasEstFallback: any;

  protected abstract isRouteAvailable(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    recipientChain: ChainName | ChainId,
  ): Promise<boolean>;

  protected abstract supportedTokens(tokens: any[]): Promise<any[]>;

  protected abstract validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean>;

  protected abstract estimateGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<number>;

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
  ): Promise<TransactionResult>;

  protected abstract parseVaa(vaa: any): any;

  // send, validate, estimate gas, isRouteAvailable, parse data from VAA/fetch data, claim
}
