import * as React from 'react';
import { Provider } from 'react-redux';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import './App.css';
import { store } from './store';
import AppRouter from './AppRouter';
import BackgroundImage from './components/Background/BackgroundImage';
import ErrorBoundary from './components/ErrorBoundary';
import { useWidgetStateManager } from 'config/configStateManager';

export default function App() {
  const { themeState } = useWidgetStateManager();
  return (
    <Provider store={store}>
      <ThemeProvider theme={themeState}>
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
