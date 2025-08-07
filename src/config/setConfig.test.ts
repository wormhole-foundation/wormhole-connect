/**
 * Tests for setConfig and dynamic config updates
 * Simulates the Portal scenario where config is updated after component mount
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WormholeConnectConfig } from './types';

// Mock the modules that setConfig imports
vi.mock('./mainnet', () => ({
  default: {
    tokens: [],
    chains: {},
    wrappedTokens: {},
    rpcs: {},
    guardianSet: {},
  },
}));

vi.mock('./testnet', () => ({
  default: {
    tokens: [],
    chains: {},
    wrappedTokens: {},
    rpcs: {},
    guardianSet: {},
  },
}));

vi.mock('./devnet', () => ({
  default: {
    tokens: [],
    chains: {},
    wrappedTokens: {},
    rpcs: {},
    guardianSet: {},
  },
}));

vi.mock('sdklegacy', () => ({
  CONFIG: {
    MAINNET: { rpcs: {} },
    TESTNET: { rpcs: {} },
    DEVNET: { rpcs: {} },
  },
}));

vi.mock('@wormhole-foundation/sdk', async () => {
  const actual = await vi.importActual('@wormhole-foundation/sdk');
  return {
    ...actual,
    wormhole: vi.fn(),
    chainToPlatform: vi.fn(),
    isChain: vi.fn(() => false),
  };
});

vi.mock('@wormhole-foundation/sdk/evm', () => ({}));
vi.mock('@wormhole-foundation/sdk/solana', () => ({}));
vi.mock('@wormhole-foundation/sdk/aptos', () => ({}));
vi.mock('@wormhole-foundation/sdk/sui', () => ({}));

describe('setConfig updates (Portal scenario)', () => {
  beforeEach(() => {
    // Clear module cache to ensure fresh config
    vi.resetModules();
  });

  it('should update routes when setConfig is called after initial load (Portal NTT scenario)', async () => {
    // This test simulates exactly what happens in Portal:
    // 1. Component loads with initial config (no NTT routes)
    // 2. NTT config loads asynchronously
    // 3. setConfig is called with new routes
    // 4. Components should reflect the new chains

    const { setConfig, default: config } = await import('./index');

    // Initial config without NTT routes (like Portal on initial load)
    const initialConfig: WormholeConnectConfig = {
      routes: [
        {
          meta: { name: 'TokenBridge' },
          supportedChains: () => ['Ethereum', 'Solana'],
        },
      ] as any,
    };

    setConfig(initialConfig);

    // Check initial state
    const initialChains = config.routes.allSupportedChains();
    expect(initialChains).toContain('Ethereum');
    expect(initialChains).toContain('Solana');
    expect(initialChains).not.toContain('HyperEVM');

    // Simulate NTT config loading (like in Portal's useConnectConfig)
    // This happens after the component has mounted
    const nttRoutes = [
      {
        meta: { name: 'ManualNtt' },
        supportedChains: () => ['HyperEVM', 'Unichain'],
      },
      {
        meta: { name: 'AutomaticNtt' },
        supportedChains: () => ['HyperEVM', 'Unichain'],
      },
    ];

    const updatedConfig: WormholeConnectConfig = {
      routes: [
        {
          meta: { name: 'TokenBridge' },
          supportedChains: () => ['Ethereum', 'Solana'],
        },
        ...nttRoutes,
      ] as any,
    };

    // This is what AppRouter does when props.config changes
    setConfig(updatedConfig);

    // Verify the routes have been updated
    const updatedChains = config.routes.allSupportedChains();

    // Should now include NTT chains
    expect(updatedChains).toContain('HyperEVM');
    expect(updatedChains).toContain('Unichain');
    // Should still have original chains
    expect(updatedChains).toContain('Ethereum');
    expect(updatedChains).toContain('Solana');
  });

  it('should handle multiple setConfig calls (config updates)', async () => {
    // Test that multiple setConfig calls work correctly
    const { setConfig, default: config } = await import('./index');

    // First config
    setConfig({
      routes: [
        {
          meta: { name: 'Route1' },
          supportedChains: () => ['Chain1'],
        },
      ] as any,
    });

    expect(config.routes.allSupportedChains()).toContain('Chain1');

    // Second config update
    setConfig({
      routes: [
        {
          meta: { name: 'Route1' },
          supportedChains: () => ['Chain1'],
        },
        {
          meta: { name: 'Route2' },
          supportedChains: () => ['Chain2'],
        },
      ] as any,
    });

    expect(config.routes.allSupportedChains()).toContain('Chain1');
    expect(config.routes.allSupportedChains()).toContain('Chain2');

    // Third config update (replaces previous)
    setConfig({
      routes: [
        {
          meta: { name: 'Route3' },
          supportedChains: () => ['Chain3'],
        },
      ] as any,
    });

    const finalChains = config.routes.allSupportedChains();
    expect(finalChains).toContain('Chain3');
    expect(finalChains).not.toContain('Chain1');
    expect(finalChains).not.toContain('Chain2');
  });
});
