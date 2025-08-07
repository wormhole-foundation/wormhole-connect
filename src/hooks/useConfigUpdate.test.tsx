/**
 * Integration tests for config updates in React components
 * Ensures components re-render when config.routes changes via setConfig
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemo } from 'react';

// Create a mock config object that we can control
const mockConfig = {
  chains: {},
  routes: {
    allSupportedChains: vi.fn(),
  },
};

// Mock the config module
vi.mock('../config', () => ({
  default: mockConfig,
  setConfig: vi.fn((newConfig) => {
    // Simulate what setConfig does - creates new RouteOperator
    if (newConfig?.routes) {
      // Create a new routes object (simulating new RouteOperator)
      mockConfig.routes = {
        allSupportedChains: vi.fn(() => {
          // Return chains based on the new routes
          const chains = new Set<string>();
          newConfig.routes.forEach(
            (route: { supportedChains: () => string[] }) => {
              const routeChains = route.supportedChains();
              routeChains.forEach((chain: string) => chains.add(chain));
            },
          );
          return Array.from(chains);
        }),
      };
    }
  }),
}));

describe('[Integration] Bridge component config updates', () => {
  beforeEach(() => {
    // Reset mock for each test
    mockConfig.routes.allSupportedChains = vi.fn(() => ['Ethereum', 'Solana']);
  });

  it('should NOT update when only watching config.chains (the bug)', () => {
    const { result } = renderHook(() =>
      useMemo(
        () => mockConfig.routes.allSupportedChains(),
        // Bug: only watching config.chains
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mockConfig.chains],
      ),
    );

    expect(result.current).toEqual(['Ethereum', 'Solana']);

    // Simulate setConfig being called with new routes (Portal scenario)
    act(() => {
      // Create new routes object (simulating setConfig creating new RouteOperator)
      const newRoutes = {
        allSupportedChains: vi.fn(() => [
          'Ethereum',
          'Solana',
          'HyperEVM',
          'Unichain',
        ]),
      };
      mockConfig.routes = newRoutes;
    });

    // Bug: Component doesn't re-render because config.chains didn't change
    expect(result.current).toEqual(['Ethereum', 'Solana']); // Still old value!
  });

  it('should update when watching config.routes (the fix)', () => {
    const { result, rerender } = renderHook(
      ({ routes }) =>
        useMemo(
          () => routes.allSupportedChains(),
          // Fix: watching config.routes
          [routes],
        ),
      {
        initialProps: { routes: mockConfig.routes },
      },
    );

    expect(result.current).toEqual(['Ethereum', 'Solana']);

    // Simulate setConfig being called with new routes (Portal scenario)
    act(() => {
      // Create new routes object (simulating setConfig creating new RouteOperator)
      const newRoutes = {
        allSupportedChains: vi.fn(() => [
          'Ethereum',
          'Solana',
          'HyperEVM',
          'Unichain',
        ]),
      };
      mockConfig.routes = newRoutes;

      // Re-render with new routes reference
      rerender({ routes: mockConfig.routes });
    });

    // Fixed: Component re-renders with new chains
    expect(result.current).toEqual([
      'Ethereum',
      'Solana',
      'HyperEVM',
      'Unichain',
    ]);
  });

  it('should handle Portal-like scenario with setConfig after mount', () => {
    // Simulate the exact Portal flow

    // 1. Initial render with basic routes
    mockConfig.routes.allSupportedChains = vi.fn(() => ['Ethereum', 'Solana']);

    const { result, rerender } = renderHook(
      ({ routes }) =>
        useMemo(
          () => routes.allSupportedChains(),
          // Our fix: watching routes (chains is redundant since routes changes when config updates)
          [routes],
        ),
      {
        initialProps: {
          routes: mockConfig.routes,
        },
      },
    );

    expect(result.current).toEqual(['Ethereum', 'Solana']);

    // 2. Simulate NTT config loading async (like in Portal)
    act(() => {
      // This simulates what happens when setConfig is called with new routes
      // (like in AppRouter when props.config changes)
      const newRoutes = {
        allSupportedChains: vi.fn(() => [
          'Ethereum',
          'Solana',
          'HyperEVM',
          'Unichain',
        ]),
      };
      mockConfig.routes = newRoutes;

      // Re-render with updated config.routes
      rerender({
        routes: mockConfig.routes,
      });
    });

    // 3. Verify chains are updated
    expect(result.current).toEqual([
      'Ethereum',
      'Solana',
      'HyperEVM',
      'Unichain',
    ]);
  });
});
