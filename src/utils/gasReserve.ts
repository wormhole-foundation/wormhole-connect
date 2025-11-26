import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import config from 'config';
import { getGasToken } from 'utils';

/**
 * Get the gas reserve amount for a given chain.
 * Returns undefined if no reserve is configured for the chain.
 *
 * @param chain - The source chain
 * @returns The amount to reserve, or undefined if no reserve configured
 */
export function getGasReserve(chain: Chain): sdkAmount.Amount | undefined {
  const chainConfig = config.chains[chain];
  const reserve = chainConfig?.gasReserve;

  if (!reserve) {
    return undefined;
  }

  try {
    const gasToken = getGasToken(chain);
    return sdkAmount.parse(reserve, gasToken.decimals);
  } catch {
    // If gas token is not configured for this chain, return undefined
    return undefined;
  }
}
