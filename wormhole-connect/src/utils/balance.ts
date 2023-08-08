import { BigNumberish, utils } from 'ethers';
import { TOKENS } from '../config';

/**
 * Makes a BigNumber have # of decimals
 */
export function toDecimals(
  amnt: BigNumberish,
  tokenDecimals: number,
  numDecimals?: number,
): string {
  const decimal = utils.formatUnits(amnt, tokenDecimals);
  return toFixedDecimals(decimal, numDecimals || 18);
}

export function toFixedDecimals(number: string, numDecimals: number) {
  if (number === '0.0') {
    return '0';
  }

  const index = number.indexOf('.');
  if (index === -1) {
    return number;
  }

  const end = index + (numDecimals || 18) + 1;
  return `${Number.parseFloat(number.slice(0, end))}`;
}

export async function getUsdVal(token: string) {
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error(`invalid token: ${token}`);
  const { coinGeckoId } = tokenConfig;
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`,
  );
  const data = await res.json();
  if (data[coinGeckoId]) {
    const { usd } = data[coinGeckoId];
    return usd;
  }
}

export async function getConversion(token1: string, token2: string) {
  const token1Val = await getUsdVal(token1);
  const token2Val = await getUsdVal(token2);
  return token1Val / token2Val;
}
