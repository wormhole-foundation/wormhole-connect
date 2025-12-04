import * as React from 'react';
import type { Network } from '@wormhole-foundation/sdk';
import type { WormholeConnectConfig, InternalConfig } from '../config/types';
import { buildConfig, setConfig } from '../config';
import config from '../config';

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
 * During the migration period, this provider also updates the global singleton
 * via setConfig() for backwards compatibility. Code that directly imports
 * `config` from 'config' will continue to work.
 *
 * TODO: Remove global singleton sync once all code uses useConfig()/useSetConfig().
 */
export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  config: userConfig,
  children,
}) => {
  // Track the current user config in state so useSetConfig can update it
  const [currentUserConfig, setCurrentUserConfig] = React.useState(userConfig);

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
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * useConfig returns the instance-scoped configuration.
 *
 * This hook must be used within a ConfigProvider. It returns the InternalConfig
 * object built from the user-provided WormholeConnectConfig.
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
