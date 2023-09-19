import * as React from 'react';
import { Provider } from 'react-redux';
// import { BigNumber } from 'ethers';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
// import Box from '@mui/material/Box';
import { PaletteMode } from '@mui/material';
// import IconButton from '@mui/material/IconButton';
// import Brightness4Icon from '@mui/icons-material/Brightness4';
// import Brightness7Icon from '@mui/icons-material/Brightness7';
import './App.css';
import { store } from './store';
import AppRouter from './AppRouter';
import { getDesignTokens } from './theme';
import { THEME_MODE } from './config';
import BackgroundImage from './components/Background/BackgroundImage';
import ErrorBoundary from './components/ErrorBoundary';
// import { fetchRFQ } from 'routes/hashflow/api';

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

function App() {
  const [mode, setMode] = React.useState<PaletteMode>(THEME_MODE);
  const colorMode = React.useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === 'light' ? 'dark' : 'light',
        );
      },
    }),
    [],
  );
  // fetchRFQ(
  //   TOKENS['USDCmumbai'].tokenId!,
  //   TOKENS['USDTmumbai'].tokenId!,
  //   'mumbai',
  //   'mumbai',
  //   BigNumber.from('1000000'),
  //   // undefined,
  //   '0x7D414a4223A5145d60Ce4c587d23f2b1a4Db50e4',
  // );
  // Update the theme only if the mode changes
  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <Provider store={store}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <ScopedCssBaseline enableColorScheme>
            <ErrorBoundary>
              <BackgroundImage>
                <AppRouter />
              </BackgroundImage>
            </ErrorBoundary>
          </ScopedCssBaseline>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </Provider>
  );
}

export default function ToggleColorMode() {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
