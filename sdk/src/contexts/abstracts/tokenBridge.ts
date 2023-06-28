import { BigNumber } from 'ethers';
import {
  AnyContracts,
  TokenId,
  ChainName,
  ChainId,
} from '../../types';

// template for different environment contexts
export abstract class TokenBridgeAbstract<TransactionResult> {
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
  ): Promise<TransactionResult>;

  protected abstract sendWithPayload(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    payload: any,
  ): Promise<TransactionResult>;

  /**
   * Format an address to a 32-byte array, padded with zeros if needed
   * @param address The address to format
   * @returns A 32 byte array of the address, padded with zeros if needed
   */
  protected abstract formatAddress(address: string): Uint8Array;
  /**
   * Parse an address to the blockchain specific address format
   * (e.g. 40-byte hex 0xabcd... for evm chains)
   * @param address The address to parse
   * @returns The parsed address to the blockchain specific format
   */
  protected abstract parseAddress(address: string | Uint8Array): string;

  protected abstract formatAssetAddress(address: string): Promise<Uint8Array>;
  protected abstract parseAssetAddress(address: string): Promise<string>;

  protected abstract getForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null>;
  protected abstract mustGetForeignAsset(
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string>;

  protected abstract getNativeBalance(
    walletAddress: string,
    chain: ChainName | ChainId,
  ): Promise<BigNumber>;
  protected abstract getTokenBalance(
    walletAddress: string,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<BigNumber | null>;

  protected abstract redeem(
    destChain: ChainName | ChainId,
    signedVAA: Uint8Array,
    overrides: any,
    payerAddr?: any,
  ): Promise<TransactionResult>;
  protected abstract isTransferCompleted(
    destChain: ChainName | ChainId,
    signedVaa: string,
  ): Promise<boolean>;
}
