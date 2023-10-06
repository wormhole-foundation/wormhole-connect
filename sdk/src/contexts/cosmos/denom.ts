import { ChainName } from '../../types';

export const NATIVE_DENOMS: Record<string, string> = {
  osmosis: 'uosmo',
  wormchain: 'uworm',
  terra2: 'uluna',
  sei: 'usei',
};

export const PREFIXES: Record<string, string> = {
  osmosis: 'osmo',
  wormchain: 'wormchain',
  terra2: 'terra',
  sei: 'sei',
};

export function getNativeDenom(chain: ChainName): string {
  const denom = NATIVE_DENOMS[chain];
  if (!denom)
    throw new Error(`Native denomination not found for chain ${chain}`);
  return denom;
}

export function getPrefix(chain: ChainName): string {
  const prefix = PREFIXES[chain];
  if (!prefix) throw new Error(`Prefix not found for chain ${chain}`);
  return prefix;
}

export function isNativeDenom(denom: string, chain: ChainName): boolean {
  try {
    const nativeDenom = getNativeDenom(chain);
    return denom === nativeDenom;
  } catch {
    return false;
  }
}
