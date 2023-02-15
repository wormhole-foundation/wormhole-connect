import * as React from 'react';
import { Provider } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { PaletteMode } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import './App.css';
import { store } from './store';
import AppRouter from './AppRouter';
import { getDesignTokens } from './theme';
import { THEME } from './sdk/config';

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

const useStyles = makeStyles()((theme) => ({
  background: {
    position: 'fixed',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
    height: '100vh',
    width: '100vw',
    zIndex: '-1',
    backgroundImage: 'url(/background-image.svg)',
    backgroundSize: 'cover',
  },
}));

function App() {
  const { classes } = useStyles();
  const [mode, setMode] = React.useState<PaletteMode>(THEME);
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
  // Update the theme only if the mode changes
  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <Provider store={store}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          {/* {mode === 'dark' && <div className={classes.background} />} */}
          <CssBaseline enableColorScheme />
          {/* light/dark theme switch */}
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'end',
              bgcolor: 'background.default',
              color: 'text.primary',
              borderRadius: 1,
              p: 3,
            }}
          >
            {theme.palette.mode} mode
            <IconButton
              sx={{ ml: 1 }}
              onClick={colorMode.toggleColorMode}
              color="inherit"
            >
              {theme.palette.mode === 'dark' ? (
                <Brightness7Icon />
              ) : (
                <Brightness4Icon />
              )}
            </IconButton>
          </Box>

          {/* App content */}
          <AppRouter />
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
