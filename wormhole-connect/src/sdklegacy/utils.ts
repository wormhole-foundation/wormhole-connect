import { Context, WormholeConfig } from './types';

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

export const waitFor = (
  condition: () => Promise<boolean>,
  ms = 1000,
  tries = 100,
): Promise<void> => {
  let count = 0;
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        if ((await condition()) || tries <= count) {
          clearInterval(interval);
          resolve();
        }
      } catch (e) {
        console.error(e);
      }

      count++;
    }, ms);
  });
};
