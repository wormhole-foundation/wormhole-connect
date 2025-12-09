import type { ReactNode } from 'react';
import * as React from 'react';
import type { Token } from 'config/tokens';

// Test-only context that mirrors ConfigContext without importing it
// This avoids triggering SDK import chains during tests
const TestConfigContext = React.createContext<unknown>(null);

// Export for tests that need direct access
export { TestConfigContext };

/**
 * Test wrapper that provides ConfigContext directly with a pre-built config.
 *
 * This bypasses ConfigProvider's buildConfig() call which has deep SDK dependencies.
 * Use this for unit tests that need useConfig() to return a specific mock config.
 *
 * IMPORTANT: Tests using this wrapper MUST mock 'contexts/ConfigContext' to use
 * TestConfigContext, otherwise useConfig() won't receive the mock config.
 *
 * For integration tests, use ConfigProvider directly with a real config.
 */
export interface TestWrapperOptions {
  /**
   * Pre-built config object to provide via context.
   * This should be a partial InternalConfig with the fields your test needs.
   */
  config?: Record<string, unknown>;
}

export const createTestWrapper = (options: TestWrapperOptions = {}) => {
  const { config } = options;

  // Match the ConfigContextType shape: { config, setConfig }
  const contextValue = {
    config,
    setConfig: () => {}, // No-op setter for tests
  };

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <TestConfigContext.Provider value={contextValue}>
      {children}
    </TestConfigContext.Provider>
  );

  return TestWrapper;
};

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
