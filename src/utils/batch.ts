import { sleep } from 'utils';

export interface BatchConfig {
  batchSize: number;
  delayMs: number;
  maxItems?: number;
}

export async function processBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  config: BatchConfig,
): Promise<R[]> {
  const { batchSize, delayMs, maxItems } = config;
  const itemsToProcess = maxItems ? items.slice(0, maxItems) : items;
  const results: R[] = [];

  for (let i = 0; i < itemsToProcess.length; i += batchSize) {
    const batch = itemsToProcess.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    if (i + batchSize < itemsToProcess.length) {
      await sleep(delayMs);
    }
  }

  return results;
}
