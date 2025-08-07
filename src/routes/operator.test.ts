/**
 * Tests for RouteOperator chain support behavior
 * Ensures that supported chains update correctly when route configurations change
 */

import { describe, it, expect, vi } from 'vitest';
import RouteOperator from './operator';

// Mock the config module
vi.mock('config', () => ({
  default: {
    network: 'Mainnet',
  },
}));

describe('RouteOperator Chain Support', () => {
  it('should reflect dynamic changes in route configurations WITHOUT manual cache clearing', () => {
    // Mock NTT config that will change dynamically
    let nttConfig: Record<string, string[]> = {};

    // Create mock route constructors
    const TokenBridgeRoute = {
      meta: { name: 'TokenBridge' },
      supportedChains: () => ['Ethereum', 'Solana', 'Arbitrum'],
    };

    const NTTRoute = {
      meta: { name: 'NTT' },
      supportedChains: () => {
        const chains = new Set<string>();
        Object.values(nttConfig).forEach((tokenChains) => {
          tokenChains.forEach((chain) => chains.add(chain));
        });
        return Array.from(chains);
      },
    };

    // Create operator with initial routes
    const operator = new RouteOperator([
      TokenBridgeRoute as any,
      NTTRoute as any,
    ]);

    // Initially, NTT config is empty so HyperEVM shouldn't be supported
    const initialChains = operator.allSupportedChains();
    expect(initialChains).not.toContain('HyperEVM');
    expect(initialChains).toContain('Ethereum');

    // Dynamically update NTT configuration to include new chains
    nttConfig = { HYPE: ['HyperEVM', 'Unichain'] };

    // The operator should reflect the new supported chains from the route constructors
    const chainsAfterUpdate = operator.allSupportedChains();

    // This should pass with our fix that calls route.rc.supportedChains()
    expect(chainsAfterUpdate).toContain('HyperEVM');
    expect(chainsAfterUpdate).toContain('Unichain');
  });

  it('should support recreating operator with updated route configurations', () => {
    let nttConfig: Record<string, string[]> = {};

    const createRoutes = () => [
      {
        meta: { name: 'TokenBridge' },
        supportedChains: () => ['Ethereum', 'Solana'],
      },
      {
        meta: { name: 'NTT' },
        supportedChains: () => {
          const chains = new Set<string>();
          Object.values(nttConfig).forEach((tokenChains) => {
            tokenChains.forEach((chain) => chains.add(chain));
          });
          return Array.from(chains);
        },
      },
    ];

    // Initial state without NTT configuration
    const operator1 = new RouteOperator(createRoutes() as any);
    const initialChains = operator1.allSupportedChains();
    expect(initialChains).not.toContain('HyperEVM');

    // Configuration updates to include new chains
    nttConfig = { HYPE: ['HyperEVM', 'Unichain'] };

    // Creating a new operator with updated routes should reflect new chains
    const operator2 = new RouteOperator(createRoutes() as any);
    const updatedChains = operator2.allSupportedChains();

    // New operator instance should have updated chain support
    expect(updatedChains).toContain('HyperEVM');
    expect(updatedChains).toContain('Unichain');
  });

  it('should handle dynamic configuration updates in UI components', () => {
    // Simulates how React components might handle route updates

    const config = {
      routes: [] as any[],
    };

    // Initial render with empty configuration
    let nttConfig: Record<string, string[]> = {};
    config.routes = [
      {
        meta: { name: 'NTT' },
        supportedChains: () =>
          Object.keys(nttConfig).length > 0 ? ['HyperEVM'] : [],
      },
    ];

    const initialOperator = new RouteOperator(config.routes);
    const initialChains = initialOperator.allSupportedChains();
    expect(initialChains).not.toContain('HyperEVM');

    // Configuration updates (simulating async config load)
    nttConfig = { HYPE: ['HyperEVM'] };

    // Routes are recreated with new configuration
    config.routes = [
      {
        meta: { name: 'NTT' },
        supportedChains: () =>
          Object.keys(nttConfig).length > 0 ? ['HyperEVM'] : [],
      },
    ];

    // New operator instance with updated routes
    const updatedOperator = new RouteOperator(config.routes);
    const updatedChains = updatedOperator.allSupportedChains();

    // Should reflect the configuration change
    expect(updatedChains).toContain('HyperEVM');

    // Note: UI components must ensure they re-render when route configurations change
  });
});
