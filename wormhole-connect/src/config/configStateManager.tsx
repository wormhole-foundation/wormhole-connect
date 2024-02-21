import { Theme, createTheme } from '@mui/material';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getDesignTokens } from '../theme';
import {
  ConfigNetwork,
  Networks,
  WidgetNetworks,
  WormholeConnectConfig,
  envMapping,
} from './types';
import { getThemeFromConfig } from 'config';

const processEnv = import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase();

// creating global conext for the theme solves the
// rerender issue when changing widget theme
// we need state vars of network change and theme change
// as these two config items cause a change in the config

// idealy i think some more of the config (RPCS, TOKENS) should be managed
// as state because when config changes its important these items update
// more so than the optional/extra config items that dont really change
interface WidgetStateManagerContext {
  themeState: Theme;
  networkState: WidgetNetworks;
  config: WormholeConnectConfig;
}

const WidgetStateManager = createContext({} as WidgetStateManagerContext);

export const WidgetStateManagerProvider: React.FC<{
  config: WormholeConnectConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  const [networkState, setNeworkState] = useState(config.env as WidgetNetworks);

  const createThemeFromConfig = useCallback(
    (config: WormholeConnectConfig) => {
      const mode = config && config.mode ? config.mode : 'dark';
      const defaultTheme = getThemeFromConfig(config);
      return createTheme(getDesignTokens(mode, defaultTheme));
    },
    [createTheme, getDesignTokens],
  );

  const [themeState, setThemeState] = useState<Theme>(() => {
    return createThemeFromConfig(config);
  });

  const toggleTheme = React.useCallback(
    (config: WormholeConnectConfig) => {
      setThemeState(() => {
        return createThemeFromConfig(config);
      });
    },
    [setThemeState],
  );
  useEffect(() => {
    toggleTheme(config);
  }, [config, toggleTheme]);

  useEffect(() => {
    const env = (config.env || processEnv || Networks.testnet) as ConfigNetwork;
    setNeworkState(envMapping[env] || WidgetNetworks.TESTNET);
  }, [config.env]);

  return (
    <WidgetStateManager.Provider
      value={{
        networkState,
        themeState,
        config,
      }}
    >
      {children}
    </WidgetStateManager.Provider>
  );
};

export const useWidgetStateManager = (): WidgetStateManagerContext =>
  useContext(WidgetStateManager);
