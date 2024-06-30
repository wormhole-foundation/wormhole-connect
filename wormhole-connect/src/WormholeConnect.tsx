import * as React from 'react';
import { Provider } from 'react-redux';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './App.css';
import { store } from './store';
import AppRouter from './AppRouter';
import { getDesignTokens, dark } from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import { WormholeConnectConfig } from './config/types';
import { WormholeConnectPartialTheme } from 'theme';
import { RouteProvider } from './contexts/RouteContext';

export interface WormholeConnectProps {
  // theme can be updated at any time to change the colors of Connect
  theme?: WormholeConnectPartialTheme;
  // config is only used once, when Connect first mounts, to initialize the global config
  config?: WormholeConnectConfig;
}

export default function WormholeConnect({
  config,
  theme,
}: WormholeConnectProps) {
  // Handle theme changes at any time
  const muiTheme = React.useMemo(
    () => createTheme(getDesignTokens(theme ?? dark)),
    [theme],
  );

  return (
    <Provider store={store}>
      <ThemeProvider theme={muiTheme}>
        <ScopedCssBaseline enableColorScheme>
          <ErrorBoundary>
            <RouteProvider>
              <AppRouter config={config} />
            </RouteProvider>
          </ErrorBoundary>
        </ScopedCssBaseline>
      </ThemeProvider>
    </Provider>
  );
}
