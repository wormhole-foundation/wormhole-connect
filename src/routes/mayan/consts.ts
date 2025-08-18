import { ethers } from 'ethers';
import type { Chain } from 'exports';
import { MayanForwarderShimContractABI } from './evm/abi';

export const ForwardEth = 'forwardEth';
export const ForwardERC20 = 'forwardERC20';

export const MAYAN_FORWARDER_SHIM_CONTRACT_ADDRESS =
  '0x87a26566dbb3bf206634c1792a96ff4989e3f56e';
export const MAYAN_FORWARDER_SHIM_CONTRACT_INTERFACE = new ethers.Interface(
  MayanForwarderShimContractABI,
);

export const POSSIBLE_VAA_TYPES = [
  // Bridge to swap chain (solana)
  'transfer',
  // Info about the swap
  'swap',
  // Successful, bridge to destination chain
  'redeem',
  // Unsuccessful auction, refund back to source chain (evm)
  'refund',
];

export const DEFAULT_DEADLINES: {
  [key in Chain]?: number;
} = {
  Bsc: 16,
  Avalanche: 16,
  Polygon: 18,
  Ethereum: 76,
  Solana: 10,
  Arbitrum: 96,
  Aptos: 50,
  Unichain: 96,
  Sui: 40,
};
