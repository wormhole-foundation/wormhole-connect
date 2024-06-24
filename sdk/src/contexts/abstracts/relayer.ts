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
