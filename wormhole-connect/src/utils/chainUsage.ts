import { Chain } from '@wormhole-foundation/sdk';
import { CHAIN_ORDER } from 'config/constants';

export type ChainUsage = {
  chain: Chain;
  count: number;
  lastUsed: number; // timestamp in ms
};

const LOCAL_STORAGE_KEY = 'wormhole-connect:chain-usage';
const HAS_LOCALSTORAGE = typeof localStorage !== 'undefined';

function loadUsage(): ChainUsage[] {
  if (!HAS_LOCALSTORAGE) return [];
  const item = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!item) return [];
  try {
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (u) =>
          typeof u.chain === 'string' &&
          typeof u.count === 'number' &&
          typeof u.lastUsed === 'number',
      ) as ChainUsage[];
    }
  } catch (e) {
    console.debug('Error reading chain usage from localStorage', e);
  }
  return [];
}

function saveUsage(usage: ChainUsage[]) {
  if (!HAS_LOCALSTORAGE) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(usage));
  } catch (e) {
    console.debug('Error saving chain usage to localStorage', e);
  }
}

export function recordChainUsage(chain: Chain) {
  const usage = loadUsage();
  const now = Date.now();
  const existing = usage.find((u) => u.chain === chain);
  if (existing) {
    existing.count += 1;
    existing.lastUsed = now;
  } else {
    usage.push({ chain, count: 1, lastUsed: now });
  }
  saveUsage(usage);
}

function score(chain: Chain, usageMap: Map<Chain, ChainUsage>, now: number) {
  const data = usageMap.get(chain);
  if (!data) return 0;
  const halfLife = 1000 * 60 * 60 * 24 * 7; // 7 days
  const recency = Math.max(0, 1 - (now - data.lastUsed) / halfLife);
  return data.count + recency * 2; // weight recency slightly higher
}

export function sortChainsByUsage<T extends { sdkName: Chain }>(
  chains: T[],
): T[] {
  const usage = loadUsage();
  const map = new Map(usage.map((u) => [u.chain, u]));
  const now = Date.now();
  return [...chains].sort((a, b) => {
    const sa = score(a.sdkName, map, now);
    const sb = score(b.sdkName, map, now);
    if (sa === sb) {
      const ai = CHAIN_ORDER.indexOf(a.sdkName);
      const bi = CHAIN_ORDER.indexOf(b.sdkName);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return 0;
    }
    return sb - sa;
  });
}

export function getUsage(): ChainUsage[] {
  return loadUsage();
}
