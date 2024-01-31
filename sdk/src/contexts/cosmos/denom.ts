import { Network } from '@certusone/wormhole-sdk';
import { ChainName } from '../../types';

const MAINNET_NATIVE_DENOMS: Record<string, string> = {
  osmosis: 'uosmo',
  wormchain: 'uworm',
  terra2: 'uluna',
  cosmoshub: 'uatom',
  evmos: 'aevmos',
  kujira: 'ukuji',
  injective: 'inj',
};
const TESTNET_NATIVE_DENOMS: Record<string, string> = {
  ...MAINNET_NATIVE_DENOMS,
  evmos: 'atevmos',
};

const PREFIXES: Record<string, string> = {
  osmosis: 'osmo',
  wormchain: 'wormhole',
  terra2: 'terra',
  cosmoshub: 'cosmos',
  evmos: 'evmos',
  sei: 'sei',
  kujira: 'kujira',
  injective: 'inj',
};

export function getNativeDenom(
  chain: ChainName,
  env: Network = 'MAINNET',
): string {
  const denom =
    env === 'TESTNET'
      ? TESTNET_NATIVE_DENOMS[chain]
      : MAINNET_NATIVE_DENOMS[chain];
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
