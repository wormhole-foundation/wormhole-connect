import * as React from 'react';
import { createStore, useStore } from 'zustand';
import type { StoreApi } from 'zustand';
import type { Network } from '@wormhole-foundation/sdk';
import type { InternalConfig } from '../config/types';

/**
 * Config store state shape.
 */
export interface ConfigState {
  config: InternalConfig<Network>;
}

/**
 * Type alias for a config store instance.
 */
export type ConfigStore = StoreApi<ConfigState>;

/**
 * Creates a new config store instance.
 *
 * Each WormholeConnect instance gets its own store, enabling multiple
 * independent widgets on the same page.
 */
export function createConfigStore(
  initialConfig: InternalConfig<Network>,
): ConfigStore {
  return createStore<ConfigState>()(() => ({
    config: initialConfig,
  }));
}

/**
 * Context for providing the store instance to the component tree.
 * Components use this to access the correct store for their WormholeConnect instance.
 */
export const ConfigStoreContext = React.createContext<ConfigStore | null>(null);

/**
 * Hook to access the config store from Context.
 * @throws Error if used outside ConfigProvider
 */
function useConfigStore(): ConfigStore {
  const store = React.useContext(ConfigStoreContext);
  if (!store) {
    throw new Error(
      'useConfigStore must be used within a ConfigProvider. ' +
        'Ensure your component is wrapped in <WormholeConnect> or <ConfigProvider>.',
    );
  }
  return store;
}

/**
 * Hook to select a slice of config with automatic memoization.
 *
 * Components using this hook only re-render when the selected value changes,
 * not when other parts of config change. Each WormholeConnect instance
 * maintains its own isolated config state.
 *
 * @example
 * ```tsx
 * // Only re-renders when network changes
 * const network = useConfigSelector((c) => c.network);
 *
 * // Only re-renders when chains change
 * const chains = useConfigSelector((c) => c.chainsArr);
 *
 * // Select multiple values (re-renders when either changes)
 * const { network, isMainnet } = useConfigSelector((c) => ({
 *   network: c.network,
 *   isMainnet: c.isMainnet,
 * }));
 * ```
 */
export function useConfigSelector<T>(
  selector: (config: InternalConfig<Network>) => T,
): T {
  const store = useConfigStore();
  return useStore(store, (state) => selector(state.config));
}

/**
 * Hook to get the full config object.
 *
 * Prefer useConfigSelector() for better performance - this hook will
 * re-render on ANY config change.
 */
export function useConfigValue(): InternalConfig<Network> {
  const store = useConfigStore();
  return useStore(store, (state) => state.config);
}

/**
 * Hook to get the store's setState function for updating config.
 * Used internally by ConfigProvider.
 */
export function useConfigStoreApi(): ConfigStore {
  return useConfigStore();
}

/**
 * Tracks the most recently created store for legacy setConfig() compatibility.
 * When legacy code calls setConfig(), we update this store.
 *
 * @deprecated This is for backwards compatibility only.
 * New code should use ConfigProvider and useConfigSelector.
 */
let legacyActiveStore: ConfigStore | null = null;

/**
 * Register a store as the "active" store for legacy setConfig() calls.
 * Called by ConfigProvider when it mounts.
 */
export function registerLegacyStore(store: ConfigStore): void {
  legacyActiveStore = store;
}

/**
 * Unregister the legacy store when ConfigProvider unmounts.
 */
export function unregisterLegacyStore(store: ConfigStore): void {
  if (legacyActiveStore === store) {
    legacyActiveStore = null;
  }
}

/**
 * Update the legacy active store from setConfig().
 * Returns false if no store is registered (no ConfigProvider mounted).
 */
export function updateLegacyStore(config: InternalConfig<Network>): boolean {
  if (legacyActiveStore) {
    legacyActiveStore.setState({ config });
    return true;
  }
  return false;
}
