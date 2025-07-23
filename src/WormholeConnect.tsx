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
import type { WormholeConnectConfig } from './config/types';
import type { WormholeConnectTheme } from 'theme';
import { RouteProvider } from './contexts/RouteContext';
import { TokensProvider } from './contexts/TokensContext';
import WalletProvider from './contexts/wallet/WalletProvider';
import type { WormholeConnectWalletProvider } from './utils/wallet/types';
import { internalWalletProvider } from './utils/wallet/InternalWalletProvider';

export interface WormholeConnectProps {
  // theme can be updated at any time to change the colors of Connect
  theme?: WormholeConnectTheme;
  // config is only used once, when Connect first mounts, to initialize the global config
  config?: WormholeConnectConfig;
  // Optional wallet provider for wallet management.
  // If not provided, Connect uses its built-in wallet provider with sidebar wallet selection.
  // If provided, it will handle ALL wallet connections - you cannot mix internal and external providers.
  // NOTE: This is an experimental feature and may be subject to change.
  walletProvider?: WormholeConnectWalletProvider;
}

export default function WormholeConnect({
  config,
  theme,
  walletProvider: externalProvider,
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

  const walletProvider = React.useMemo(() => {
    return externalProvider ?? internalWalletProvider;
  }, [externalProvider]);

  return (
    <Provider store={store}>
      <ThemeProvider theme={muiTheme}>
        <ScopedCssBaseline enableColorScheme>
          <ErrorBoundary>
            <WalletProvider provider={walletProvider}>
              <TokensProvider>
                <RouteProvider>
                  <AppRouter config={config} />
                </RouteProvider>
              </TokensProvider>
            </WalletProvider>
          </ErrorBoundary>
        </ScopedCssBaseline>
      </ThemeProvider>
    </Provider>
  );
}
