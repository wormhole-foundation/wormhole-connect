import { circle } from '@wormhole-foundation/sdk';
import { Contracts } from './types';

export const CONTRACTS: Contracts = {
  Arbitrum: {
    USDC: circle.usdcContract.get('Mainnet', 'Arbitrum'),
  },
  Base: {
    USDC: circle.usdcContract.get('Mainnet', 'Base'),
  },
  Ethereum: {
    USDC: circle.usdcContract.get('Mainnet', 'Ethereum'),
  },
  Solana: {
    USDC: circle.usdcContract.get('Mainnet', 'Solana'),
  },
};
