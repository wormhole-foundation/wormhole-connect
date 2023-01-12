export function NoProviderError(chain: string | number) {
  return `Missing provider for domain: ${chain}.\nHint: Have you called \`context.registerProvider(${chain}, provider)\` yet?`;
}
