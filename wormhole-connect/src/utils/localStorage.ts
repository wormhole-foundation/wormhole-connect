import config from 'config';

/**
 * Builds a localStorage key with the configured cache namespace prefix
 * @param key The base localStorage key (without wormhole-connect prefix)
 * @returns The namespaced localStorage key with wormhole-connect prefix
 */
export function buildLocalStorageKey(key: string): string {
  // We need to handle circular dependency, so we access the config differently
  const namespace = config.cacheNamespace;
  const baseKey = `wormhole-connect:${key}`;
  return namespace ? `${namespace}:${baseKey}` : baseKey;
}
