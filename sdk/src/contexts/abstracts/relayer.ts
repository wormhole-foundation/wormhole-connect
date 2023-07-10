import { BigNumber, BigNumberish } from 'ethers';
import { TokenId, ChainName, ChainId, ParsedRelayerPayload } from '../../types';
import { TokenBridgeAbstract } from './tokenBridge';

/**
 * @abstract
 *
 * A standard set of methods for interacting with the Token Bridge Relayer contracts across any of the supported chains
 *
 * @example
 * const context = Wormhole.getContext(chain); // get the chain Context
 * const hasRelayer = context.relaySupported(chain);
 * if (hasRelayer) {
 *   // call any of the supported methods in a standardized uniform fashion
 *   context.sendWithRelay(...);
 * }
 */
export abstract class RelayerAbstract<
  TransactionResult,
> extends TokenBridgeAbstract<TransactionResult> {
  /**
   * Returns if the Token Bridge relayer is supported on a given chain
   *
   * @param chain The chain name or id
   * @returns True/False if the Token Bridge relayer is supported or not
   */
  protected relaySupported(chain: ChainName | ChainId) {
    const contracts = this.context.getContracts(chain);
    if (!contracts) return false;
    return !!contracts.relayer;
  }

  /**
   * Send a Token Bridge Relay transfer. This will automatically dispatch funds to the recipient on the destination chain.
   *
   * @param token The Token Identifier (native chain/address) or `'native'` if sending the native token
   * @param amount The token amount to be sent, as a string
   * @param toNativeToken The amount of sending token to be converted to native gas token on the destination chain
   * @param sendingChain The source chain name or id
   * @param senderAddress The address that is dispatching the transfer
   * @param recipientChain The destination chain name or id
   * @param recipientAddress The wallet address where funds will be sent (On solana, this is the associated token account)
   * @param overrides Optional overrides, varies by chain
   * @returns The transaction receipt
   */
  protected abstract sendWithRelay(
    token: TokenId | 'native',
    amount: string,
    toNativeToken: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    overrides?: any,
  ): Promise<TransactionResult>;
  /**
   * Computes the amount of native gas tokens that would be received, given current conversion rates
   *
   * @param destChain The destination chain name or id
   * @param tokenId The token identifier (native chain/address)
   * @param amount The amount of the sending token which would be converted to native tokens on the destination chain
   * @param walletAddress The receiving wallet address
   * @returns The amount of destination gas drop-off
   */
  protected abstract calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
    walletAddress: string,
  ): Promise<BigNumber>;
  /**
   * Gets the maximum amount of sending token which can be converted to destination native gas token
   *
   * @param destChain The destination chain name or id
   * @param tokenId The token identifier (native chain/address)
   * @param walletAddress The receiving wallet address
   * @returns The maximum swap amount
   */
  protected abstract calculateMaxSwapAmount(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    walletAddress: string,
  ): Promise<BigNumber>;
  /**
   * Gets the relayer fee (paid using sending token)
   *
   * @param sourceChain The source chain name or id
   * @param destChain The destination chain name or id
   * @param tokenId The token identifier (native chain/address)
   * @returns The relayer fee
   */
  protected abstract getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber>;

  parseRelayerPayload(transferPayload: Buffer): ParsedRelayerPayload {
    return {
      relayerPayloadId: transferPayload.readUint8(0),
      relayerFee: BigNumber.from(
        '0x' + transferPayload.subarray(1, 33).toString('hex'),
      ),
      toNativeTokenAmount: BigNumber.from(
        '0x' + transferPayload.subarray(33, 65).toString('hex'),
      ),
      to: '0x' + transferPayload.subarray(65, 98).toString('hex'),
    };
  }
}
