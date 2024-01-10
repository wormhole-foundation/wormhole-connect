import { ethers } from 'ethers';

export const porticoAbi = new ethers.utils.Interface([
  'function start((bytes32,address,address,address,address,address,uint256,uint256,uint256,uint256)) returns (address,uint16,uint64)',
]);

export const porticoSwapFinishedEvent =
  '0xc2addcb063016f6dc1647fc8cd7206c3436cc4293c4acffe4feac288459ca7fc';

export const uniswapQuoterV2Abi = new ethers.utils.Interface([
  'function quoteExactInputSingle((address,address,uint256,uint24,uint160)) public view returns (uint256,uint160,uint32,uint256)',
]);
