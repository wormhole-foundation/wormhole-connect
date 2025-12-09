/**
 * Tests for Zustand-based config store
 * Verifies store creation, selector hooks, and legacy bridge functionality
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Network } from '@wormhole-foundation/sdk';
import type { InternalConfig } from '../config/types';
import {
  createConfigStore,
  ConfigStoreContext,
  useConfigSelector,
  useConfigValue,
  registerLegacyStore,
  unregisterLegacyStore,
  updateLegacyStore,
  type ConfigStore,
} from './configStore';

// Mock config for testing - use `any` for overrides to avoid strict typing on mock data
const createMockConfig = (
  overrides: Record<string, any> = {},
): InternalConfig<Network> =>
  ({
    network: 'Mainnet' as Network,
    isMainnet: true,
    chainsArr: ['Ethereum', 'Solana'],
    tokens: {},
    chains: {},
    routes: {
      allSupportedChains: () => ['Ethereum', 'Solana'],
    },
    rpcs: {},
    ...overrides,
  } as unknown as InternalConfig<Network>);

describe('configStore', () => {
  describe('createConfigStore', () => {
    it('should create a store with initial config', () => {
      const mockConfig = createMockConfig();
      const store = createConfigStore(mockConfig);

      expect(store.getState().config).toBe(mockConfig);
    });

    it('should allow updating config via setState', () => {
      const initialConfig = createMockConfig({ network: 'Mainnet' as Network });
      const store = createConfigStore(initialConfig);

      const updatedConfig = createMockConfig({ network: 'Testnet' as Network });
      store.setState({ config: updatedConfig });

      expect(store.getState().config.network).toBe('Testnet');
    });

    it('should create independent store instances', () => {
      const config1 = createMockConfig({ network: 'Mainnet' as Network });
      const config2 = createMockConfig({ network: 'Testnet' as Network });

      const store1 = createConfigStore(config1);
      const store2 = createConfigStore(config2);

      expect(store1.getState().config.network).toBe('Mainnet');
      expect(store2.getState().config.network).toBe('Testnet');

      // Updating one store should not affect the other
      store1.setState({
        config: createMockConfig({ network: 'Devnet' as Network }),
      });

      expect(store1.getState().config.network).toBe('Devnet');
      expect(store2.getState().config.network).toBe('Testnet');
    });
  });

  describe('useConfigSelector', () => {
    it('should return selected value from config', () => {
      const mockConfig = createMockConfig({ network: 'Mainnet' as Network });
      const store = createConfigStore(mockConfig);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store}>
          {children}
        </ConfigStoreContext.Provider>
      );

      const { result } = renderHook(
        () => useConfigSelector((config) => config.network),
        { wrapper },
      );

      expect(result.current).toBe('Mainnet');
    });

    it('should throw error when used outside ConfigProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useConfigSelector((config) => config.network));
      }).toThrow('useConfigStore must be used within a ConfigProvider');

      consoleSpy.mockRestore();
    });

    it('should update when selected value changes', () => {
      const mockConfig = createMockConfig({ network: 'Mainnet' as Network });
      const store = createConfigStore(mockConfig);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store}>
          {children}
        </ConfigStoreContext.Provider>
      );

      const { result } = renderHook(
        () => useConfigSelector((config) => config.network),
        { wrapper },
      );

      expect(result.current).toBe('Mainnet');

      act(() => {
        store.setState({
          config: createMockConfig({ network: 'Testnet' as Network }),
        });
      });

      expect(result.current).toBe('Testnet');
    });

    it('should NOT re-render when unrelated config values change', () => {
      const mockConfig = createMockConfig({
        network: 'Mainnet' as Network,
        isMainnet: true,
      });
      const store = createConfigStore(mockConfig);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store}>
          {children}
        </ConfigStoreContext.Provider>
      );

      let renderCount = 0;
      const { result } = renderHook(
        () => {
          renderCount++;
          return useConfigSelector((config) => config.network);
        },
        { wrapper },
      );

      expect(result.current).toBe('Mainnet');
      expect(renderCount).toBe(1);

      // Update an unrelated value (isMainnet)
      act(() => {
        store.setState({
          config: createMockConfig({
            network: 'Mainnet' as Network, // Same network
            isMainnet: false, // Different value
          }),
        });
      });

      // Should not have re-rendered since network didn't change
      expect(result.current).toBe('Mainnet');
      expect(renderCount).toBe(1);
    });

    it('should support derived primitive selectors', () => {
      const mockConfig = createMockConfig({
        network: 'Mainnet' as Network,
        isMainnet: true,
        chainsArr: ['Ethereum', 'Solana', 'Arbitrum'],
      });
      const store = createConfigStore(mockConfig);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store}>
          {children}
        </ConfigStoreContext.Provider>
      );

      // For primitive selectors, no issues
      const { result: networkResult } = renderHook(
        () => useConfigSelector((config) => config.network),
        { wrapper },
      );

      const { result: chainCountResult } = renderHook(
        () => useConfigSelector((config) => config.chainsArr.length),
        { wrapper },
      );

      expect(networkResult.current).toBe('Mainnet');
      expect(chainCountResult.current).toBe(3);
    });

    it('should support array selectors with stable references', () => {
      const mockConfig = createMockConfig({
        chainsArr: ['Ethereum', 'Solana', 'Arbitrum'],
      });
      const store = createConfigStore(mockConfig);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store}>
          {children}
        </ConfigStoreContext.Provider>
      );

      // Selecting the array directly works (same reference)
      const { result } = renderHook(
        () => useConfigSelector((config) => config.chainsArr),
        { wrapper },
      );

      expect(result.current).toEqual(['Ethereum', 'Solana', 'Arbitrum']);
    });
  });

  describe('useConfigValue', () => {
    it('should return full config object', () => {
      const mockConfig = createMockConfig();
      const store = createConfigStore(mockConfig);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store}>
          {children}
        </ConfigStoreContext.Provider>
      );

      const { result } = renderHook(() => useConfigValue(), { wrapper });

      expect(result.current).toBe(mockConfig);
    });

    it('should throw error when used outside ConfigProvider', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useConfigValue());
      }).toThrow('useConfigStore must be used within a ConfigProvider');

      consoleSpy.mockRestore();
    });

    it('should update when any config value changes', () => {
      const mockConfig = createMockConfig({ network: 'Mainnet' as Network });
      const store = createConfigStore(mockConfig);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store}>
          {children}
        </ConfigStoreContext.Provider>
      );

      const { result } = renderHook(() => useConfigValue(), { wrapper });

      expect(result.current.network).toBe('Mainnet');

      const updatedConfig = createMockConfig({ network: 'Testnet' as Network });
      act(() => {
        store.setState({ config: updatedConfig });
      });

      expect(result.current.network).toBe('Testnet');
      expect(result.current).toBe(updatedConfig);
    });
  });

  describe('legacy store bridge', () => {
    let store: ConfigStore;

    beforeEach(() => {
      store = createConfigStore(createMockConfig());
    });

    afterEach(() => {
      // Clean up any registered stores
      unregisterLegacyStore(store);
    });

    it('should register a store for legacy updates', () => {
      registerLegacyStore(store);

      const newConfig = createMockConfig({ network: 'Testnet' as Network });
      const result = updateLegacyStore(newConfig);

      expect(result).toBe(true);
      expect(store.getState().config.network).toBe('Testnet');
    });

    it('should return false when no store is registered', () => {
      // Don't register any store
      const newConfig = createMockConfig({ network: 'Testnet' as Network });
      const result = updateLegacyStore(newConfig);

      expect(result).toBe(false);
    });

    it('should unregister store correctly', () => {
      registerLegacyStore(store);

      // Verify it's registered
      expect(
        updateLegacyStore(createMockConfig({ network: 'Testnet' as Network })),
      ).toBe(true);
      expect(store.getState().config.network).toBe('Testnet');

      // Unregister
      unregisterLegacyStore(store);

      // Should no longer update
      expect(
        updateLegacyStore(createMockConfig({ network: 'Devnet' as Network })),
      ).toBe(false);
      // Store should still have the last value
      expect(store.getState().config.network).toBe('Testnet');
    });

    it('should only unregister if the same store is passed', () => {
      const store2 = createConfigStore(createMockConfig());

      registerLegacyStore(store);

      // Try to unregister a different store
      unregisterLegacyStore(store2);

      // Original store should still be registered
      const newConfig = createMockConfig({ network: 'Testnet' as Network });
      expect(updateLegacyStore(newConfig)).toBe(true);
      expect(store.getState().config.network).toBe('Testnet');
    });

    it('should replace previously registered store', () => {
      const store2 = createConfigStore(
        createMockConfig({ network: 'Devnet' as Network }),
      );

      registerLegacyStore(store);
      registerLegacyStore(store2); // Replace with store2

      const newConfig = createMockConfig({ network: 'Testnet' as Network });
      updateLegacyStore(newConfig);

      // store2 should be updated, not store
      expect(store2.getState().config.network).toBe('Testnet');
      expect(store.getState().config.network).toBe('Mainnet'); // Unchanged
    });
  });

  describe('multi-instance isolation', () => {
    it('should maintain separate state for multiple WormholeConnect instances', () => {
      // Simulate two WormholeConnect widgets on the same page
      const store1 = createConfigStore(
        createMockConfig({
          network: 'Mainnet' as Network,
          chainsArr: ['Ethereum', 'Solana'],
        }),
      );

      const store2 = createConfigStore(
        createMockConfig({
          network: 'Testnet' as Network,
          chainsArr: ['Sepolia', 'Solana'],
        }),
      );

      const Wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store1}>
          {children}
        </ConfigStoreContext.Provider>
      );

      const Wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <ConfigStoreContext.Provider value={store2}>
          {children}
        </ConfigStoreContext.Provider>
      );

      // Hook in instance 1
      const { result: result1 } = renderHook(
        () => useConfigSelector((c) => c.network),
        { wrapper: Wrapper1 },
      );

      // Hook in instance 2
      const { result: result2 } = renderHook(
        () => useConfigSelector((c) => c.network),
        { wrapper: Wrapper2 },
      );

      expect(result1.current).toBe('Mainnet');
      expect(result2.current).toBe('Testnet');

      // Update store1 only
      act(() => {
        store1.setState({
          config: createMockConfig({ network: 'Devnet' as Network }),
        });
      });

      expect(result1.current).toBe('Devnet');
      expect(result2.current).toBe('Testnet'); // Unchanged
    });
  });
});
