import { createTheme } from '@mui/material/styles';
import grey from '@mui/material/colors/grey';
import green from '@mui/material/colors/green';
import orange from '@mui/material/colors/orange';
import purple from '@mui/material/colors/purple';
import red from '@mui/material/colors/red';
import { PaletteMode } from '@mui/material';
import { OPACITY } from './utils/style';

export type PaletteColor = {
  25?: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950?: string;
  A100?: string;
  A200?: string;
  A400?: string;
  A700?: string;
};

export type WormholeConnectPartialTheme = {
  mode?: PaletteMode;
  primary?: PaletteColor;
  secondary?: PaletteColor;
  divider?: string;
  background?: {
    default: string;
    badge: string;
  };
  text?: {
    primary: string;
    secondary: string;
  };
  error?: PaletteColor;
  info?: PaletteColor;
  success?: PaletteColor;
  warning?: PaletteColor;
  button?: {
    primary: string;
    primaryText: string;
    disabled: string;
    disabledText: string;
    action: string;
    actionText: string;
    hover: string;
  };
  options?: {
    hover: string;
    select: string;
  };
  card?: {
    background: string;
    elevation: string;
    secondary: string;
  };
  popover?: {
    background: string;
    elevation: string;
    secondary: string;
  };
  modal?: {
    background: string;
  };
  font?: string;
  logo?: string;
};

export type WormholeConnectTheme = Required<WormholeConnectPartialTheme>;

export const light: WormholeConnectTheme = {
  mode: 'light',
  primary: {
    50: '#161718',
    100: '#2d2e30',
    200: '#444548',
    300: '#5b5c60',
    400: '#727479',
    500: '#898b91',
    600: '#a0a2a9',
    700: '#b7b9c1',
    800: '#ced0d9',
    900: '#E5E8F2',
    A100: '#ceced1',
    A200: '#9d9ea4',
    A400: '#535660',
    A700: '#0a0e1c',
  },
  secondary: grey,
  divider: '#a0a2a9',
  background: {
    default: '#E5E8F2',
    badge: '#E5E8F2',
  },
  text: {
    primary: grey[900],
    secondary: grey[800],
  },
  error: red,
  info: {
    50: '#d1e3f9',
    100: '#c8def7',
    200: '#bfd8f6',
    300: '#b6d3f5',
    400: '#adcdf4',
    500: '#A4C8F3',
    600: '#93b4da',
    700: '#83a0c2',
    800: '#728caa',
    900: '#627891',
    A100: '#A4C8F3',
    A200: '#A4C8F3',
    A400: '#A4C8F3',
    A700: '#A4C8F3',
  },
  success: green,
  warning: orange,
  button: {
    primary: '#ffffff',
    primaryText: grey[900],
    disabled: '#c8cad1',
    disabledText: grey[800],
    action: '#F3A01E',
    actionText: '#000000',
    hover: '#b7b9c1',
  },
  options: {
    hover: '#f9f9fb',
    select: '#F0F0F5',
  },
  card: {
    background: '#ffffff',
    elevation: '10px 10px 30px 15px #CCD2E7',
    secondary: '#F0F0F5',
  },
  popover: {
    background: '#ffffff',
    elevation: '10px 10px 30px 15px #CCD2E7',
    secondary: '#F0F0F5',
  },
  modal: {
    background: '#ffffff',
  },
  font: '"Inter", sans-serif',
  logo: '#000000',
};

// wormhole styled theme
export const dark: WormholeConnectTheme = {
  mode: 'dark',
  primary: {
    25: '#FCFAFF',
    50: '#F9F5FF',
    100: '#F4EBFF',
    200: '#E9D7FE',
    300: '#D6BBFB',
    400: '#B692F6',
    500: '#9E77ED',
    600: '#7F56D9',
    700: '#6941C6',
    800: '#53389E',
    900: '#42307D',
    950: '#2C1C5F',
    A100: purple.A100,
    A200: purple.A200,
    A400: purple.A400,
    A700: purple.A700,
  },
  secondary: {
    25: '#FCFCFD',
    50: '#F9FAFB',
    100: '#F2F4F7',
    200: '#E4E7EC',
    300: '#D0D5DD',
    400: '#98A2B3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1D2939',
    900: '#101828',
    950: '#0C111D',
    A100: grey.A100,
    A200: grey.A200,
    A400: grey.A400,
    A700: grey.A700,
  },
  divider: '#ffffff' + OPACITY[20],
  background: {
    default: '#010101',
    badge: '#010101',
  },
  text: {
    primary: '#ffffff',
    secondary: '#79859e',
  },
  info: {
    50: '#97a5b7',
    100: '#8293a9',
    200: '#6e819a',
    300: '#596f8c',
    400: '#445d7e',
    500: '#304C70',
    600: '#2b4464',
    700: '#263c59',
    800: '#21354e',
    900: '#1c2d43',
    A100: '#304C70',
    A200: '#304C70',
    A400: '#304C70',
    A700: '#304C70',
  },
  error: {
    25: '#FFFBFA',
    50: '#FEF3F2',
    100: '#FEE4E2',
    200: '#FECDCA',
    300: '#FDA29B',
    400: '#F97066',
    500: '#F04438',
    600: '#D92D20',
    700: '#B42318',
    800: '#912018',
    900: '#7A271A',
    950: '#55160C',
    A100: red.A100,
    A200: red.A200,
    A400: red.A400,
    A700: red.A700,
  },
  success: {
    25: '#F6FEF9',
    50: '#ECFDF3',
    100: '#D1FADF',
    200: '#A6F4C5',
    300: '#6CE9A6',
    400: '#32D583',
    500: '#12B76A',
    600: '#039855',
    700: '#027A48',
    800: '#05603A',
    900: '#054F31',
    950: '#053321',
    A100: green.A100,
    A200: green.A200,
    A400: green.A400,
    A700: green.A700,
  },
  warning: {
    25: '#FFFCF5',
    50: '#FFFAEB',
    100: '#FEF0C7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#7A2E0E',
    950: '#4E1D09',
    A100: orange.A100,
    A200: orange.A200,
    A400: orange.A400,
    A700: orange.A700,
  },
  button: {
    primary: '#ffffff' + OPACITY[10],
    primaryText: '#ffffff',
    disabled: '#ffffff' + OPACITY[7],
    disabledText: '#ffffff' + OPACITY[40],
    action: '#ffffff',
    actionText: '#000000',
    hover: '#ffffff' + OPACITY[7],
  },
  options: {
    hover: '#ffffff' + OPACITY[7],
    select: '#ffffff' + OPACITY[10],
  },
  card: {
    background: '#ffffff' + OPACITY[5],
    secondary: '#ffffff' + OPACITY[5],
    elevation: 'none',
  },
  popover: {
    background: '#1b2033',
    secondary: '#ffffff' + OPACITY[5],
    elevation: 'none',
  },
  modal: {
    background: '#181a2d',
  },
  font: '"Inter", sans-serif',
  logo: '#ffffff',
};

export const getDesignTokens = (customTheme: WormholeConnectPartialTheme) => {
  const baseTheme = customTheme?.mode === 'light' ? light : dark;
  const theme = Object.assign(baseTheme, customTheme) as WormholeConnectTheme;

  return createTheme({
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            background: theme.modal.background + ' !important',
          },
        },
      },
      MuiCollapse: {
        styleOverrides: {
          root: {
            width: '100%',
          },
        },
      },
    },
    breakpoints: {
      values: {
        xs: 300,
        sm: 500,
        md: 650,
        lg: 900,
        xl: 1200,
      },
    },
    typography: {
      fontFamily: customTheme.font ?? '"Inter", sans-serif',
    },
    palette: {
      ...theme,
    },
  });
};
