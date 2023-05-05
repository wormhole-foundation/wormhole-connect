import { BigNumber, BigNumberish } from 'ethers';
import { TokenId, ChainName, ChainId } from '../../types';
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
}
