import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { ExtendedTheme, dark, light } from '../theme';
import { WormholeConnectConfig } from './types';

interface ConfigProviderContextType {
  themeState: {
    mode: 'dark' | 'light';
    customTheme: ExtendedTheme | undefined;
    defaultTheme: ExtendedTheme;
  };
  networkState: 'MAINNET' | 'DEVNET' | 'TESTNET';
  config: WormholeConnectConfig;
}
const ConfigContext = createContext({} as ConfigProviderContextType);

export const ConfigProvider: React.FC<{
  config: WormholeConnectConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  const networkState = useMemo(() => {
    const processEnv = import.meta.env.REACT_APP_CONNECT_ENV?.toLowerCase();
    if (config.env === 'mainnet' || processEnv === 'mainnet') return 'MAINNET';
    if (config.env === 'devnet' || processEnv === 'devnet') return 'DEVNET';
    return 'TESTNET';
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
    <ConfigContext.Provider
      value={{
        networkState,
        themeState,
        config,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
