import { Context, WormholeConfig } from './types';

export function filterByContext(config: WormholeConfig, context: Context) {
  return Object.values(config.chains).filter((c) => c.context === context);
}

export function stripHexPrefix(val: string) {
  return val.startsWith('0x') ? val.slice(2) : val;
}
