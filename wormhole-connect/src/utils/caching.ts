/**
 * Builds a localStorage key with the configured cache namespace prefix
 * @param key The base localStorage key (without wormhole-connect prefix)
 * @returns The namespaced localStorage key with wormhole-connect prefix
 */
export function buildLocalStorageKey(key: string, namespace?: string): string {
  const baseKey = `wormhole-connect:${key}`;
  return namespace ? `${namespace}:${baseKey}` : baseKey;
}
