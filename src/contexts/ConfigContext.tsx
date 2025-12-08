import * as React from 'react';
import type { Network } from '@wormhole-foundation/sdk';
import type { WormholeConnectConfig, InternalConfig } from '../config/types';
import { buildConfig, setConfig } from '../config';
import config from '../config';
import {
  createConfigStore,
  ConfigStoreContext,
  registerLegacyStore,
  unregisterLegacyStore,
  type ConfigStore,
} from '../store/configStore';

export type SetConfigFn = (customConfig?: WormholeConnectConfig) => void;

export interface ConfigContextType {
  config: InternalConfig<Network>;
  setConfig: SetConfigFn;
}

const ConfigContext = React.createContext<ConfigContextType | null>(null);

export interface ConfigProviderProps {
  config?: WormholeConnectConfig;
  children: React.ReactNode;
}

/**
 * ConfigProvider builds and provides instance-scoped configuration.
 *
 * Each ConfigProvider creates its own Zustand store instance, enabling
 * multiple WormholeConnect widgets on the same page with independent configs.
 *
 * During the migration period, this provider also updates the global singleton
 * via setConfig() for backwards compatibility. Code that directly imports
 * `config` from 'config' will continue to work.
 *
 * TODO: Remove global singleton sync once all code uses useConfigSelector().
 */
export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  config: userConfig,
  children,
}) => {
  // Track the current user config in state so useSetConfig can update it
  const [currentUserConfig, setCurrentUserConfig] = React.useState(userConfig);

  // Create store instance once per provider (stable across re-renders)
  const storeRef = React.useRef<ConfigStore | null>(null);

  // Build instance-specific config from user config
  // Memoize to prevent rebuilding on every render
  const internalConfig = React.useMemo(() => {
    // Build the config for this instance
    const builtConfig = buildConfig(currentUserConfig);

    // Also update global singleton for backwards compatibility
    // This ensures files that directly import config still work
    // TODO: Remove when singleton is eliminated
    if (currentUserConfig) {
      setConfig(currentUserConfig);
    }

    return builtConfig;
  }, [currentUserConfig]);

  // Initialize or update the store
  if (!storeRef.current) {
    storeRef.current = createConfigStore(internalConfig);
  } else {
    // Update existing store when config changes
    storeRef.current.setState({ config: internalConfig });
  }

  // Register this store for legacy setConfig() calls
  React.useEffect(() => {
    const store = storeRef.current!;
    registerLegacyStore(store);

    return () => {
      unregisterLegacyStore(store);
    };
  }, []);

  // Setter that updates both context state AND global singleton
  const updateConfig = React.useCallback(
    (customConfig?: WormholeConnectConfig) => {
      // Update local state (triggers re-render and useMemo rebuild)
      setCurrentUserConfig(customConfig);

      // Also update global singleton for code that imports config directly
      // TODO: Remove when singleton is eliminated
      setConfig(customConfig);
    },
    [],
  );

  // Trigger events on config changes (mirrors AppRouter behavior)
  const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      config.triggerEvent({
        type: 'load',
        config: currentUserConfig,
      });
    } else {
      config.triggerEvent({
        type: 'config',
        config: currentUserConfig,
      });
    }
  }, [currentUserConfig]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({ config: internalConfig, setConfig: updateConfig }),
    [internalConfig, updateConfig],
  );

  return (
    <ConfigStoreContext.Provider value={storeRef.current}>
      <ConfigContext.Provider value={contextValue}>
        {children}
      </ConfigContext.Provider>
    </ConfigStoreContext.Provider>
  );
};

/**
 * useConfig returns the instance-scoped configuration.
 *
 * This hook must be used within a ConfigProvider. It returns the InternalConfig
 * object built from the user-provided WormholeConnectConfig.
 *
 * NOTE: This hook re-renders on ANY config change. For better performance,
 * use useConfigSelector() to subscribe to specific config properties.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useConfig();
 *   return <div>Network: {config.network}</div>;
 * }
 * ```
 *
 * @throws Error if used outside of ConfigProvider
 */
export function useConfig(): InternalConfig<Network> {
  const contextValue = React.useContext(ConfigContext);

  if (contextValue === null) {
    throw new Error(
      'useConfig must be used within a ConfigProvider. ' +
        'Ensure your component is wrapped in <WormholeConnect> or <ConfigProvider>.',
    );
  }

  return contextValue.config;
}

/**
 * useSetConfig returns a function to update the configuration.
 *
 * The setter updates both the context state AND the global singleton,
 * ensuring backwards compatibility with code that imports config directly.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const setConfig = useSetConfig();
 *
 *   const handleNetworkChange = () => {
 *     setConfig({ network: 'Testnet' });
 *   };
 *
 *   return <button onClick={handleNetworkChange}>Switch to Testnet</button>;
 * }
 * ```
 *
 * @throws Error if used outside of ConfigProvider
 */
export function useSetConfig(): SetConfigFn {
  const contextValue = React.useContext(ConfigContext);

  if (contextValue === null) {
    throw new Error(
      'useSetConfig must be used within a ConfigProvider. ' +
        'Ensure your component is wrapped in <WormholeConnect> or <ConfigProvider>.',
    );
  }

  return contextValue.setConfig;
}

export { ConfigContext };

// Re-export selector-based hooks from the Zustand store
// These provide granular subscriptions to avoid unnecessary re-renders
export { useConfigSelector, useConfigValue } from '../store/configStore';
