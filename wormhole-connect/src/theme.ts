import { createTheme } from '@mui/material/styles';
import grey from '@mui/material/colors/grey';
import green from '@mui/material/colors/green';
import orange from '@mui/material/colors/orange';
import red from '@mui/material/colors/red';
import { PaletteMode } from '@mui/material';
import { OPACITY } from './utils/style';

// const light: PaletteOptions = {
//   primary: {
//     50: '#161718',
//     100: '#2d2e30',
//     200: '#444548',
//     300: '#5b5c60',
//     400: '#727479',
//     500: '#898b91',
//     600: '#a0a2a9',
//     700: '#b7b9c1',
//     800: '#ced0d9',
//     900: '#E5E8F2',
//     A100: '#ceced1',
//     A200: '#9d9ea4',
//     A400: '#535660',
//     A700: '#0a0e1c',
//   },
//   secondary: grey,
//   divider: '#727479',
//   background: {
//     default: '#E5E8F2',
//   },
//   text: {
//     primary: grey[900],
//     secondary: grey[800],
//   },
//   error: red,
//   info: lightBlue,
//   success: green,
//   warning: orange,
// }

export type PaletteColor = {
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
  A100: string;
  A200: string;
  A400: string;
  A700: string;
};

export type ExtendedTheme = {
  primary: PaletteColor;
  secondary: PaletteColor;
  divider: string;
  background: {
    default: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  error: PaletteColor;
  info: PaletteColor;
  success: PaletteColor;
  warning: PaletteColor;
  button: {
    primary: string;
    primaryText: string;
    disabled: string;
    disabledText: string;
    action: string;
    actionText: string;
    hover: string;
  };
  options: {
    hover: string;
    select: string;
  };
  card: {
    background: string;
    elevation: string;
    secondary: string;
  };
  popover: {
    background: string;
    elevation: string;
    secondary: string;
  };
};

const lightStyled = {
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
  },
  text: {
    primary: grey[900],
    secondary: grey[800],
  },
  error: red,
  info: {
    // #7EB1EF
    50: '#BED8F6',
    100: '#B1D0F5',
    200: '#A4C8F3',
    300: '#97C0F2',
    400: '#8AB8F0',
    500: '#7EB1EF',
    600: '#719FD7',
    700: '#648DBF',
    800: '#587BA7',
    900: '#4B6A8F',
    A100: '#7EB1EF',
    A200: '#7EB1EF',
    A400: '#7EB1EF',
    A700: '#7EB1EF',
  },
  success: green,
  warning: orange,
  button: {
    primary: '#F0F0F5',
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
};

const dark = {
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
  secondary: grey,
  divider: '#6c6e76',
  background: {
    default: '#0A0E1C',
  },
  text: {
    primary: '#ffffff',
    secondary: grey[500],
  },
  error: red,
  info: {
    50: '#294958',
    100: '#2f5464',
    200: '#355e71',
    300: '#3b697e',
    400: '#4e788a',
    500: '#628797',
    600: '#7596a4',
    700: '#89a5b1',
    800: '#222632',
    900: '#9db4be',
    A100: '#3b697e',
    A200: '#3b697e',
    A400: '#3b697e',
    A700: '#3b697e',
  },
  success: green,
  warning: orange,
  button: {
    primary: '#222632',
    primaryText: '#fff',
    disabled: '#6c6e76',
    disabledText: '#9d9ea4',
    action: '#2b867d',
    actionText: '#fff',
    hover: '#ffffff' + OPACITY[7],
  },
  options: {
    hover: '#ffffff' + OPACITY[7],
    select: '#ffffff' + OPACITY[10],
  },
  card: {
    background: '#141826',
    secondary: '#222633',
    elevation: 'none',
  },
  popover: {
    background: '#1b2033',
    secondary: '#222840',
    elevation: 'none',
  },
};

export const getDesignTokens = (mode: PaletteMode) =>
  createTheme({
    breakpoints: {
      values: {
        xs: 300,
        sm: 500,
        md: 650,
        lg: 900,
        xl: 1200,
      },
    },
    palette: {
      mode,
      ...(mode === 'light' ? lightStyled : dark),
    },
  });
