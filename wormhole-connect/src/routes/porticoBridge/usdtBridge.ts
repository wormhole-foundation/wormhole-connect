import config from 'config';
import { PorticoBridge } from './porticoBridge';
import { Route } from 'config/types';
import { getQuote } from './quoter';
import { ChainName, ChainId } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';

// USDT will be swapped on PancakeSwap if a Portico PancakeSwap contract is available,
// otherwise it will be swapped on Uniswap
export class USDTBridge extends PorticoBridge {
  readonly TYPE: Route = Route.USDTBridge;
  static readonly SUPPORTED_TOKENS: string[] = [
    'USDT',
    'USDTpolygon',
    'USDTavax',
    'USDTarbitrum',
    'USDToptimism',
    'USDTbsc',
    'USDTbase',
  ];

  constructor() {
    super(USDTBridge.SUPPORTED_TOKENS, config.usdtBridgeMaxAmount);
  }

  isSupportedChain(chain: ChainName): boolean {
    if (super.isSupportedChain(chain)) {
      return true;
    }
    const { porticoPancakeSwap, pancakeSwapQuoterV2 } =
      config.wh.getContracts(chain) || {};
    return !!(porticoPancakeSwap && pancakeSwapQuoterV2);
  }

  async getQuote(
    chain: ChainName | ChainId,
    tokenIn: string,
    tokenOut: string,
    amountIn: BigNumber,
    fee: number,
  ): Promise<{ amountOut: BigNumber }> {
    const { pancakeSwapQuoterV2, uniswapQuoterV2 } =
      config.wh.mustGetContracts(chain);
    // Use PancakeSwap quoter if available, otherwise use Uniswap quoter
    const address = pancakeSwapQuoterV2 || uniswapQuoterV2;
    if (!address) {
      throw new Error('Quoter address not found');
    }
    const quote = getQuote(chain, address, tokenIn, tokenOut, amountIn, fee);
    return quote;
  }

  getPorticoAddress(chain: ChainName | ChainId): string {
    const { porticoPancakeSwap, porticoUniswap } =
      config.wh.mustGetContracts(chain);
    // Use PancakeSwap Portico contract if available, otherwise use Uniswap Portico contract
    const address = porticoPancakeSwap || porticoUniswap;
    if (!address) {
      throw new Error('Portico address not found');
    }
    return address;
  }
}
