import * as React from 'react';
// fixes "styled_default is not a function" error
// https://github.com/vitejs/vite/issues/12423#issuecomment-2080351394
import '@mui/material/styles/styled';
import { Provider } from 'react-redux';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import './App.css';
import { store } from './store';
import AppRouter from './AppRouter';
import { generateTheme } from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import { WormholeConnectConfig } from './config/types';
import { WormholeConnectTheme } from 'theme';
import { RouteProvider } from './contexts/RouteContext';
import { TokensProvider } from './contexts/TokensContext';

export interface WormholeConnectProps {
  // theme can be updated at any time to change the colors of Connect
  theme?: WormholeConnectTheme;
  // config is only used once, when Connect first mounts, to initialize the global config
  config?: WormholeConnectConfig;
}

export default function WormholeConnect({
  config,
  theme,
}: WormholeConnectProps) {

  React.useEffect(() => {
    // IMPORTANT: This is a workaround to expose the Redux store to the window object so it can be used in automated tests.
    if (!globalThis.dispatchReduxAction) {
      (window as any).dispatchReduxAction = (action: any) => {
        store.dispatch(action);
      };
    }
  }, []);

  // Handle theme changes at any time
  const muiTheme = React.useMemo(
    () => generateTheme(theme ?? { mode: 'dark' }),
    [theme],
  );

  return (
    <Provider store={store}>
      <ThemeProvider theme={muiTheme}>
        <ScopedCssBaseline enableColorScheme>
          <ErrorBoundary>
            <TokensProvider>
              <RouteProvider>
                <AppRouter config={config} />
              </RouteProvider>
            </TokensProvider>
          </ErrorBoundary>
        </ScopedCssBaseline>
      </ThemeProvider>
    </Provider>
  );
}
