import config from 'config';

/**
 * Builds a localStorage key with the configured cache namespace prefix
 * @param key The base localStorage key
 * @returns The namespaced localStorage key
 */
export function buildLocalStorageKey(key: string): string {
  // We need to handle circular dependency, so we access the config differently
  let namespace = config.cacheNamespace;
  return namespace ? `${namespace}:${key}` : key;
}
