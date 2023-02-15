import { createTheme } from '@mui/material/styles';
import grey from '@mui/material/colors/grey';
import green from '@mui/material/colors/green';
import orange from '@mui/material/colors/orange';
import red from '@mui/material/colors/red';
import lightblue from '@mui/material/colors/lightBlue';
import { PaletteMode } from '@mui/material';

export const OPACITY = {
  0: '00',
  5: '0C',
  7: '0F',
  10: '19',
  15: '26',
  20: '33',
  25: '3F',
  30: '4C',
  35: '59',
  40: '66',
  45: '72',
  50: '7F',
  55: '8C',
  60: '99',
  65: 'A5',
  70: 'B2',
  75: 'BF',
  80: 'CC',
  85: 'D8',
  90: 'E5',
  95: 'F2',
  100: 'FF',
};

// export type PaletteColor = {
//   50: string;
//   100: string;
//   200: string;
//   300: string;
//   400: string;
//   500: string;
//   600: string;
//   700: string;
//   800: string;
//   900: string;
//   A100: string;
//   A200: string;
//   A400: string;
//   A700: string;
// };

// export type ExtendedTheme = {
//   primary: PaletteColor;
//   secondary: PaletteColor;
//   divider: string;
//   background: {
//     default: string;
//   };
//   text: {
//     primary: string;
//     secondary: string;
//   };
//   error: PaletteColor;
//   info: PaletteColor;
//   success: PaletteColor;
//   warning: PaletteColor;
//   button: {
//     primary: string;
//     primaryText: string;
//     disabled: string;
//     disabledText: string;
//     action: string;
//     actionText: string;
//     hover: string;
//   };
//   options: {
//     hover: string;
//     select: string;
//   };
//   card: {
//     background: string;
//     elevation: string;
//     secondary: string;
//   };
//   popover: {
//     background: string;
//     elevation: string;
//     secondary: string;
//   };
//   modal: {
//     background: string;
//   };
// };

// basic light theme
export const light = {
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
};

// basic dark theme
export const dark = {
  primary: grey,
  secondary: grey,
  divider: '#ffffff' + OPACITY[20],
  background: {
    default: '#232323',
  },
  text: {
    primary: '#ffffff',
    secondary: grey[500],
  },
  error: red,
  info: lightblue,
  success: green,
  warning: orange,
  button: {
    primary: '#ffffff' + OPACITY[20],
    primaryText: '#ffffff',
    disabled: '#ffffff' + OPACITY[10],
    disabledText: '#ffffff' + OPACITY[40],
    action: orange[300],
    actionText: '#000000',
    hover: '#ffffff' + OPACITY[7],
  },
  options: {
    hover: '#474747',
    select: '#5b5b5b',
  },
  card: {
    background: '#333333',
    secondary: '#474747',
    elevation: 'none',
  },
  popover: {
    background: '#1b2033',
    secondary: '#ffffff' + OPACITY[5],
    elevation: 'none',
  },
  modal: {
    background: '#474747',
  },
};
