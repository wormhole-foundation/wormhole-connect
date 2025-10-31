import type { Token } from 'config/tokens';

/**
 * Helper to create mock tokens for testing
 */
export const createMockToken = (overrides: Partial<Token> = {}): Token => {
  const chain = overrides.chain || 'Ethereum';
  const addressString = overrides.addressString || '0x1234567890abcdef';
  const address = overrides.address || addressString;

  return {
    chain,
    addressString,
    address,
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    isNativeGasToken: false,
    isTokenBridgeWrappedToken: false,
    isBuiltin: false,
    tokenId: {
      chain,
      address,
    },
    ...overrides,
  } as Token;
};
