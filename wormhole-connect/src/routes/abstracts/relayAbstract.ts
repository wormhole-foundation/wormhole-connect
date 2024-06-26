import { ChainId, ChainName, TokenId } from 'sdklegacy';
import { BigNumber } from 'ethers5';

export abstract class RelayAbstract {
  // swap information (native gas slider)
  abstract nativeTokenAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber>;

  abstract maxSwapAmount(
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber>;
}
