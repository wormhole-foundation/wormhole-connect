import { TokenId, ChainName, ChainId } from '../types';

// template for different environment contexts
export abstract class BridgeAbstract {
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
    relayerFee: any,
  ): any;

  protected abstract sendWithPayload(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: any,
  ): any;

  protected abstract formatAddress(address: any): string;

  // parseMessageFromTx
  // getForeignAsset
  // redeem
}

export abstract class RelayerAbstract extends BridgeAbstract {
  // calculateNativeTokenAmt
}
