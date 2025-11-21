import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

/**
 * Gas reserve amounts to keep when clicking "Max" on gas tokens.
 * These reserves ensure users have enough gas to complete transactions.
 *
 * Values provided by team based on typical transaction costs:
 * - Ethereum: 0.01 ETH ($30 notional)
 * - L2s (Base, Op, Arb): 0.001 ETH ($3 notional)
 * - Other EVM L1s or cheap Move L1s: 0.01 native token
 * - Solana: 0.01 SOL ($1.3 notional)
 */
const GAS_RESERVES: Partial<Record<Chain, string>> = {
  // Ethereum mainnet - higher reserve due to higher gas costs
  Ethereum: '0.01',

  // L2s - lower reserve due to cheaper gas
  Base: '0.001',
  Optimism: '0.001',
  Arbitrum: '0.001',

  // Other EVM L1s - standard reserve
  Bsc: '0.01',
  Avalanche: '0.01',
  Polygon: '0.01',
  Fantom: '0.01',
  Celo: '0.01',
  Moonbeam: '0.01',

  // Solana
  Solana: '0.01',

  // Move chains
  Sui: '0.01',
  Aptos: '0.01',
};

/**
 * Get the gas reserve amount for a given chain.
 * Returns undefined if no reserve is configured for the chain.
 *
 * @param chain - The source chain
 * @param decimals - The token decimals
 * @returns The amount to reserve, or undefined if no reserve configured
 */
export function getGasReserve(
  chain: Chain,
  decimals: number,
): sdkAmount.Amount | undefined {
  const reserve = GAS_RESERVES[chain];
  if (!reserve) {
    return undefined;
  }

  return sdkAmount.parse(reserve, decimals);
}
