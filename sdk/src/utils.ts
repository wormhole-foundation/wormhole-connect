import { BigNumber, utils } from 'ethers';
import { ChainName, Context, MessageIdentifier, ParsedMessage, WormholeConfig } from './types';

export const NORMALIZED_DECIMALS = 8;

export function filterByContext(config: WormholeConfig, context: Context) {
  return Object.values(config.chains).filter((c) => c.context === context);
}

export function stripHexPrefix(val: string) {
  return val.startsWith('0x') ? val.slice(2) : val;
}

export function ensureHexPrefix(val: string) {
  return val.startsWith('0x') ? val : `0x${val}`;
}

export function fromNormalizedDecimals(
  amount: BigNumber,
  decimals: number,
): BigNumber {
  return decimals > NORMALIZED_DECIMALS
    ? utils.parseUnits(amount.toString(), decimals - NORMALIZED_DECIMALS)
    : amount;
}

export function toNormalizedDecimals(
  amount: BigNumber,
  decimals: number,
): string {
  const normalizedDecimals =
    decimals > NORMALIZED_DECIMALS ? NORMALIZED_DECIMALS : decimals;
  return utils.formatUnits(amount, normalizedDecimals);
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

export function getEmitterAndSequence(
  txData: ParsedMessage,
): MessageIdentifier {
  if (!txData.emitterAddress) throw Error('No vaa emitter address');
  if (!txData.sequence) throw Error('No vaa sequence');
  const emitterAddress = txData.emitterAddress.startsWith('0x')
    ? txData.emitterAddress.slice(2)
    : txData.emitterAddress;
  return {
    emitterChain: txData.fromChainId,
    emitterAddress,
    sequence: txData.sequence.toString(),
  };
}
