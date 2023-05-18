import { BigNumber, BigNumberish } from 'ethers';
import { TokenId, ChainName, ChainId, ParsedRelayerPayload } from '../../types';
import { TokenBridgeAbstract } from './tokenBridge';

export abstract class RelayerAbstract<
  TransactionResult,
> extends TokenBridgeAbstract<TransactionResult> {
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
  protected abstract calculateNativeTokenAmt(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    amount: BigNumberish,
    walletAddress: string,
  ): Promise<BigNumber>;
  protected abstract calculateMaxSwapAmount(
    destChain: ChainName | ChainId,
    tokenId: TokenId,
    walletAddress: string,
  ): Promise<BigNumber>;
  protected abstract getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    tokenId: TokenId,
  ): Promise<BigNumber>;

  parseRelayerPayload(payload: Buffer): ParsedRelayerPayload {
    return {
      relayerPayloadId: payload.readUint8(133),
      relayerFee: BigNumber.from(
        '0x' + payload.subarray(134, 166).toString('hex'),
      ),
      toNativeTokenAmount: BigNumber.from(
        '0x' + payload.subarray(166, 198).toString('hex'),
      ),
      to: '0x' + payload.subarray(198, 231).toString('hex'),  
    };
  }
}
