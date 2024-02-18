import * as React from 'react';
import { Provider } from 'react-redux';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './App.css';
import { store } from './store';
import AppRouter from './AppRouter';
import { getDesignTokens } from './theme';
import BackgroundImage from './components/Background/BackgroundImage';
import ErrorBoundary from './components/ErrorBoundary';
import { useConfig } from 'config/GlobalConfig';

export default function App() {
  const { themeState } = useConfig();

  // Update the theme only if the mode changes
  const theme = React.useMemo(
    () =>
      createTheme(getDesignTokens(themeState.mode, themeState.defaultTheme)),
    [themeState.mode, themeState.defaultTheme],
  );

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ScopedCssBaseline enableColorScheme>
          <ErrorBoundary>
            <BackgroundImage>
              <AppRouter />
            </BackgroundImage>
          </ErrorBoundary>
        </ScopedCssBaseline>
      </ThemeProvider>
    </Provider>
  );
}
