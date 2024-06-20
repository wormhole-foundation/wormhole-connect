import { BigNumber, BigNumberish } from 'ethers';
import {
  TokenId,
  ChainName,
  ChainId,
  ParsedRelayerPayload,
  NATIVE,
} from '../../types';
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
