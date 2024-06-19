import ethers from 'ethers';
import { ChainName, Context, WormholeConfig } from './types';

export function filterByContext(config: WormholeConfig, context: Context) {
  return Object.values(config.chains).filter((c) => c.context === context);
}

export function stripHexPrefix(val: string) {
  return val.startsWith('0x') ? val.slice(2) : val;
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
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

export const waitFor = (
  condition: () => Promise<boolean>,
  ms: number = 1000,
  tries: number = 100,
): Promise<void> => {
  let count = 0;
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        if ((await condition()) || tries <= count) {
          clearInterval(interval);
          resolve();
        }
      } catch (e) {}

      count++;
    }, ms);
  });
};

export function keccak256(data: ethers.BytesLike): Buffer {
  return Buffer.from(ethers.utils.arrayify(ethers.utils.keccak256(data)));
}
