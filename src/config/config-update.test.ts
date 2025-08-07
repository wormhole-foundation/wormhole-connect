/**
 * Tests for config updates and route changes
 * Ensures that config updates properly propagate to route operators
 */

import { describe, it, expect, vi } from 'vitest';
import RouteOperator from '../routes/operator';

// Mock config module
vi.mock('../config', () => ({
  default: {
    network: 'Mainnet',
  },
}));

describe('RouteOperator Config Updates', () => {
  it('should reflect new routes when RouteOperator is recreated', () => {
    // Simulate initial routes without NTT
    const initialRoutes = [
      {
        meta: { name: 'TokenBridge' },
        supportedChains: () => ['Ethereum', 'Solana'],
      },
    ] as any;

    let operator = new RouteOperator(initialRoutes);
    let supportedChains = operator.allSupportedChains();

    expect(supportedChains).toContain('Ethereum');
    expect(supportedChains).toContain('Solana');
    expect(supportedChains).not.toContain('HyperEVM');

    // Simulate config update with NTT routes
    const updatedRoutes = [
      {
        meta: { name: 'TokenBridge' },
        supportedChains: () => ['Ethereum', 'Solana'],
      },
      {
        meta: { name: 'NTT' },
        supportedChains: () => ['HyperEVM', 'Unichain'],
      },
    ] as any;

    // Create new operator (this is what setConfig does)
    operator = new RouteOperator(updatedRoutes);
    supportedChains = operator.allSupportedChains();

    // Should now include NTT chains
    expect(supportedChains).toContain('HyperEVM');
    expect(supportedChains).toContain('Unichain');
  });

  it('should handle dynamic NTT config that changes after initialization', () => {
    // This simulates the Portal scenario
    let nttChains: string[] = [];

    const routes = [
      {
        meta: { name: 'TokenBridge' },
        supportedChains: () => ['Ethereum', 'Solana'],
      },
      {
        meta: { name: 'NTT' },
        // This returns different values based on nttChains state
        supportedChains: () => nttChains,
      },
    ] as any;

    const operator = new RouteOperator(routes);

    // Initially no NTT chains
    let supportedChains = operator.allSupportedChains();
    expect(supportedChains).not.toContain('HyperEVM');

    // Simulate NTT config loading dynamically
    nttChains = ['HyperEVM', 'Unichain'];

    // Get supported chains again
    supportedChains = operator.allSupportedChains();

    // With our fix, this should now include the dynamically added chains
    expect(supportedChains).toContain('HyperEVM');
    expect(supportedChains).toContain('Unichain');
  });
});
