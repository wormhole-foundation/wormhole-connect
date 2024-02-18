import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { ExtendedTheme, dark, light } from '../theme';
import {
  ConfigNetwork,
  Networks,
  WidgetNetworks,
  WormholeConnectConfig,
  envMapping,
} from './types';
import { PaletteMode } from '@mui/material';

// creating global conext for the theme solves the
// rerender issue when changing widget theme
// we need state vars of network change and theme change
// as these two config items cause a change in the config

// idealy i think some more of the config (RPCS, TOKENS) should be managed
// as state because when config changes its important these items update
// more so than the optional/extra config items that dont really change
interface WidgetStateManagerContext {
  themeState: {
    mode: PaletteMode;
    customTheme: ExtendedTheme | undefined;
    defaultTheme: ExtendedTheme;
  };
  networkState: WidgetNetworks;
  config: WormholeConnectConfig;
}

const WidgetStateManager = createContext({} as WidgetStateManagerContext);

export const WidgetStateManagerProvider: React.FC<{
  config: WormholeConnectConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  const networkState = useMemo(() => {
    const processEnv = import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase();
    const env = (config.env || processEnv || Networks.testnet) as ConfigNetwork;
    return envMapping[env] || WidgetNetworks.TESTNET;
  }, [config.env]);

  const themeState = useMemo(() => {
    const mode = config && config.mode ? config.mode : 'dark';
    const customTheme = config && config.customTheme;
    const baseTheme = mode === 'dark' ? dark : light;
    const defaultTheme = customTheme
      ? Object.assign({}, baseTheme, customTheme)
      : baseTheme;

    return { mode, customTheme, defaultTheme };
  }, [config.mode, config.customTheme]);

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
