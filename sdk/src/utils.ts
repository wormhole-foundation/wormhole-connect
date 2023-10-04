import { ChainName, Context, WormholeConfig } from './types';

export function filterByContext(config: WormholeConfig, context: Context) {
  return Object.values(config.chains).filter((c) => c.context === context);
}

export function stripHexPrefix(val: string) {
  return val.startsWith('0x') ? val.slice(2) : val;
}

// (asset chain, asset address, foreign chain) => address
type ForeignAssetCacheMap = Partial<
  Record<ChainName, Partial<Record<string, Partial<Record<ChainName, string>>>>>
>;
export class ForeignAssetCache {
  private cache: ForeignAssetCacheMap;

  constructor() {
    this.cache = {};
  }

  get(assetChain: ChainName, assetAddress: string, foreignChain: ChainName) {
    return this.cache[assetChain]?.[assetAddress]?.[foreignChain];
  }

  set(
    assetChain: ChainName,
    assetAddress: string,
    foreignChain: ChainName,
    address: string,
  ) {
    if (!this.cache[assetChain]) {
      this.cache[assetChain] = {};
    }
    if (!this.cache[assetChain]![assetAddress]) {
      this.cache[assetChain]![assetAddress] = {};
    }
    this.cache[assetChain]![assetAddress]![foreignChain] = address;
  }
}
