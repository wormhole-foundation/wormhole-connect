import { amount } from '@wormhole-foundation/sdk-base';

/**
 * Makes a BigNumber have # of decimals
 */
export function toDecimals(
  amt: bigint | string,
  decimals: number,
  precision?: number,
): string {
  return amount.display(
    {
      amount: amt.toString(),
      decimals,
    },
    precision,
  );
}

export function toFixedDecimals(val: string, numDecimals: number) {
  if (typeof val !== 'string') {
    throw new Error('Invalid argument');
  }

  if (val === '0.0') {
    return '0';
  }

  if (!val.includes('.')) {
    return val;
  }

  return parseFloat(val).toFixed(numDecimals);
}
