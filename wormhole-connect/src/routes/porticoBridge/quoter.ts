import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber, ethers } from 'ethers';
import { uniswapQuoterV2Abi } from './abis';
import config from 'config';

export interface Quote {
  amountOut: BigNumber;
}

export async function getQuote(
  chain: ChainName | ChainId,
  quoterAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber,
  fee: number,
): Promise<Quote> {
  if (tokenIn === tokenOut) {
    return { amountOut: amountIn };
  }
  const provider = config.wh.mustGetProvider(chain);
  const contract = new ethers.Contract(
    quoterAddress,
    uniswapQuoterV2Abi,
    provider,
  );
  const result = await contract.functions.quoteExactInputSingle([
    tokenIn,
    tokenOut,
    amountIn,
    fee,
    0,
  ]);
  return { amountOut: result[0] };
}
