import { BigNumber, BigNumberish } from 'ethers';
import {
  AnyContracts,
  ParsedMessage,
  ParsedRelayerMessage,
  TokenId,
  ChainName,
  ChainId,
} from '../../types';

// template for different environment contexts
export abstract class TokenBridgeAbstract {
  protected abstract contracts: AnyContracts;

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
  ): Promise<any>;

  protected abstract sendWithPayload(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: any,
  ): Promise<any>;

  protected abstract formatAddress(address: string): any;
  protected abstract parseAddress(address: any): string;

  protected abstract getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string>;
  protected abstract parseMessageFromTx(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<ParsedMessage[] | ParsedRelayerMessage[]>;

  protected abstract getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber>;
  protected abstract getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null>;

  protected abstract approve(
    chain: ChainName | ChainId,
    contractAddress: string,
    token: string,
    amount?: BigNumberish,
    overrides?: any,
  ): Promise<any>;
  protected abstract redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    receivingAddr?: any,
  ): Promise<any>;
  protected abstract isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean>;
}
