import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import config from 'config';
import type { Token } from 'config/tokens';
import SDKv2Route from 'routes/sdkv2/route';

/**
 * Round up a value to a specific number of decimal places
 * @param value - The value to round up (in base units)
 * @param decimals - The number of decimal places for the token
 * @param maxDecimals - Maximum decimal places to keep (default 6)
 */
export function roundUpToDecimals(
  value: bigint,
  decimals: number,
  maxDecimals: number = 6,
): bigint {
  if (decimals <= maxDecimals) {
    // No rounding needed if token has 6 or fewer decimals
    return value;
  }

  const factor = BigInt(10 ** (decimals - maxDecimals));
  const remainder = value % factor;

  if (remainder === 0n) {
    // Already rounded
    return value;
  }

  // Round up to the nearest value at maxDecimals precision
  return value - remainder + factor;
}

/**
 * Apply the offset formula to calculate how much extra to send so the user receives the desired amount after fee deduction.
 *
 * Mathematical derivation:
 * - Goal: sent - (sent × feeRate) = desired
 * - Factor out sent: sent × (1 - feeRate) = desired
 * - Solve for sent: sent = desired / (1 - feeRate)
 * - Offset = sent - desired = desired × feeRate / (1 - feeRate)
 *
 * For basis points (bps): feeRate = bps / 10000, so offset = amount × bps / (10000 - bps)
 * For deci-basis points (dbps): feeRate = dbps / 100000, so offset = amount × dbps / (100000 - dbps)
 *
 * @param amount - The desired output amount (what user wants to receive)
 * @param feeRate - The fee rate as a fraction (e.g., 0.001 for 0.1%)
 * @param feeDenominator - The denominator for the fee calculation (10000 for bps, 100000 for dbps)
 * @returns The offset amount to add to ensure user receives the desired amount
 */
export function applyOffsetFormula(
  amount: sdkAmount.Amount,
  feeRate: bigint,
  feeDenominator: bigint,
): sdkAmount.Amount {
  // Calculate offset: amount * feeRate / (feeDenominator - feeRate)
  let offsetUnits =
    (sdkAmount.units(amount) * feeRate) / (feeDenominator - feeRate);

  // Round up to 6 decimal places if needed
  offsetUnits = roundUpToDecimals(offsetUnits, amount.decimals);

  return sdkAmount.fromBaseUnits(offsetUnits, amount.decimals);
}

/**
 * Calculate the fee offset amount needed to achieve the desired output after fee deduction
 * @param amount - The desired output amount (what user wants to receive)
 * @param routeName - The name of the route
 * @param sourceToken - The source token (required for token-specific fees)
 * @param destChain - Optional destination chain (for Mayan routes)
 * @param destToken - Optional destination token (for Mayan routes)
 * @returns The additional amount to add so that after fee deduction, user receives the desired amount
 */
export function calculateFeeOffset(
  route: SDKv2Route | string,
  amount: sdkAmount.Amount | undefined,
  sourceToken: Token | undefined,
  destChain?: string,
  destToken?: Token,
): sdkAmount.Amount | undefined {
  if (!amount || !route || sdkAmount.units(amount) === 0n) {
    return undefined;
  }

  let sdkRoute: SDKv2Route | undefined;
  if (typeof route === 'string') {
    sdkRoute = config.routes.get(route);
    if (!sdkRoute) {
      return undefined;
    }
  } else if (route instanceof SDKv2Route) {
    sdkRoute = route;
  } else {
    return undefined;
  }

  // Handle Mayan routes differently - they use getReferrerBps function
  if (sdkRoute.rc.meta.name.startsWith('MayanSwap')) {
    const mayanRoute = sdkRoute.rc as any;
    if (mayanRoute.getReferrerBps && sourceToken && destToken) {
      // Create a RouteTransferRequest object for Mayan's getReferrerBps
      const request = {
        source: {
          id: sourceToken.tokenId || {
            chain: sourceToken.chain,
            address: sourceToken.address,
          },
          symbol: sourceToken.symbol,
        },
        destination: {
          id: destToken.tokenId || {
            chain: destChain || destToken.chain,
            address: destToken.address,
          },
          symbol: destToken.symbol,
        },
      };
      const bps = mayanRoute.getReferrerBps(request);
      if (bps > 0) {
        // Mayan uses basis points (1 bps = 0.01% = 1/10000)
        return applyOffsetFormula(amount, BigInt(bps), 10000n);
      }
    }
    return undefined;
  }

  // Handle SDK routes with static config
  const routeConfig = (sdkRoute.rc as any).config;

  if (!routeConfig) {
    return undefined;
  }

  let feeDbps = 0n;

  // CCTP Executor routes use referrerFeeDbps directly
  if (routeConfig.referrerFeeDbps !== undefined) {
    feeDbps = routeConfig.referrerFeeDbps;
  }
  // NTT Executor route uses referrerFee.feeDbps
  else if (routeConfig.referrerFee?.feeDbps !== undefined) {
    // Check for token-specific override in NTT
    if (config.tokens && sourceToken) {
      const tokenKey = sourceToken.key;
      const tokenConfig = config.tokens[tokenKey];
      if (tokenConfig?.referrerFeeDbps !== undefined) {
        feeDbps = tokenConfig.referrerFeeDbps;
      } else {
        feeDbps = routeConfig.referrerFee.feeDbps;
      }
    } else {
      feeDbps = routeConfig.referrerFee.feeDbps;
    }
  }
  // Token Bridge Executor route uses referrerFee.referrerFeeDbps
  else if (routeConfig.referrerFee?.referrerFeeDbps !== undefined) {
    feeDbps = routeConfig.referrerFee.referrerFeeDbps;
  }

  if (feeDbps === 0n) {
    return undefined;
  }

  // Other routes use deci-basis points (1 dbps = 0.001% = 1/100000)
  return applyOffsetFormula(amount, feeDbps, 100000n);
}

/**
 * Format fee display text
 */
export function formatFeeDisplay(
  fee: sdkAmount.Amount | undefined,
  token: Token | undefined,
): string | undefined {
  if (!fee || !token || sdkAmount.units(fee) === 0n) {
    return undefined;
  }

  const feeDisplay = sdkAmount.display(fee);
  const tokenSymbol = token.symbol;

  return `+${feeDisplay} ${tokenSymbol} fee`;
}
