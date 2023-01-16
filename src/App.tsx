import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { PaletteMode } from '@mui/material';
import { makeStyles } from '@mui/styles';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import amber from '@mui/material/colors/amber';
import grey from '@mui/material/colors/grey';
import './App.css';
// import BackgroundImage from './components/BackgroundImage';

const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

const getDesignTokens = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // palette values for light mode
            primary: amber,
            divider: amber[200],
            text: {
              primary: grey[900],
              secondary: grey[800],
            },
          }
        : {
            // palette values for dark mode
            primary: {
              50: '#e6e6e8',
              100: '#ceced1',
              200: '#b5b6ba',
              300: '#9d9ea4',
              400: '#84868d',
              500: '#6c6e76',
              600: '#535660',
              700: '#3a3e49',
              800: '#222632',
              900: '#0a0e1c',
              A100: '#ceced1',
              A200: '#9d9ea4',
              A400: '#535660',
              A700: '#0a0e1c',
            },
            divider: '#3a3e49',
            background: {
              default: '#0A0E1C',
              paper: '#0A0E1C',
            },
            text: {
              primary: '#fff',
              secondary: grey[500],
            },
          }),
    },
  });

const useStyles = makeStyles(() => ({
  appContent: {
    margin: 'auto',
    maxWidth: '900px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
}));

function App() {
  const [mode, setMode] = React.useState<PaletteMode>('light');
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

  const classes = useStyles();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {/* <BackgroundImage /> */}
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
        <div className={classes.appContent}>my app</div>
      </ThemeProvider>
    </ColorModeContext.Provider>
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
