/**
 * Utility functions for sorting arrays
 */

/**
 * Sort items with time property of Date type (most recent first)
 */
export function sortByTime<T extends { time: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.time) {
      return 1;
    }
    if (!b.time) {
      return -1;
    }
    return b.time.getTime() - a.time.getTime();
  });
}
