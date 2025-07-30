import { createTheme } from '@mui/material/styles';
import grey from '@mui/material/colors/grey';
import type { PaletteMode, Theme } from '@mui/material';
import { OPACITY } from './utils/style';
import Color from 'color';

export type WormholeConnectTheme = {
  // "dark" or "light"
  mode: PaletteMode;
  // Background of surrounding application
  background?: PaletteMode;
  // Background of the container surrounding form fields (asset pickers, amount input and confirm button)
  formBackground?: PaletteMode;
  // Color of input fields, like asset picker and amount input
  input?: string;
  // Whether input fields will be transparent
  inputFillTreatment?: boolean;
  // Primary brand color
  primary?: string;
  // Secondary brand color
  secondary?: string;
  // Primary text color
  text?: string;
  // Secondary text color
  textSecondary?: string;
  // Error message color
  error?: string;
  // Success message color
  success?: string;
  // Font family
  font?: string;
};

type Color = { main: string };

type BackgroundType = {
  default: string;
  form?: string;
};

export type InternalTheme = {
  mode: PaletteMode;
  primary: Color;
  secondary: Color;
  divider: string;
  background: BackgroundType;
  text: {
    primary: string;
    secondary: string;
  };
  error: Color;
  info: Color;
  success: Color;
  warning: Color;
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
  input: {
    background: string;
    border: string;
    fillTreatment: boolean;
  };
  formContainer?: {
    background: string;
    border: string;
  };
  font: string;
  logo: string;
};

export const light: InternalTheme = {
  mode: 'light',
  primary: { main: '#9892e6' },
  secondary: { main: '#cccccc' },
  divider: '#a0a2a9',
  background: {
    default: 'transparent',
    form: '#ffffff',
  },
  text: {
    primary: grey[900],
    secondary: '#7d7d7d',
  },
  error: { main: '#f44336' },
  info: {
    main: '#A4C8F3',
  },
  success: { main: '#4caf50' },
  warning: { main: '#ff9800' },
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
  input: {
    background: '#f9f9f9',
    border: '#DEE0E3',
    fillTreatment: true,
  },
  font: '"Inter", sans-serif',
  logo: '#000000',
};

// wormhole styled theme
export const dark: InternalTheme = {
  mode: 'dark',
  primary: { main: '#AFA7F6' },
  secondary: { main: '#667085' },
  divider: '#ffffff' + OPACITY[20],
  background: {
    default: 'transparent',
    form: '#0E0D12',
  },
  text: {
    primary: '#ffffff',
    secondary: '#79859e',
  },
  info: {
    main: '#304C70',
  },
  error: {
    main: '#F04438',
  },
  success: {
    main: '#12B76A',
  },
  warning: {
    main: '#F79009',
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
    background: '#1b2033',
    secondary: '#ffffff' + OPACITY[5],
    elevation: 'none',
  },
  popover: {
    background: '#1b2033',
    secondary: '#ffffff' + OPACITY[5],
    elevation: 'none',
  },
  input: {
    background: '#1B1A21',
    border: '#2B2A2E',
    fillTreatment: true,
  },
  font: '"Inter", sans-serif',
  logo: '#ffffff',
};

export const generateTheme = (customTheme: WormholeConnectTheme): Theme => {
  const isLightMode = customTheme.mode === 'light';
  const baseTheme = isLightMode ? light : dark;
  const theme = Object.assign({}, baseTheme) as InternalTheme;

  // Override built-in theme with whichever custom values we've been provided
  if (customTheme) {
    if (customTheme.background) {
      theme.background = {
        default: customTheme.background,
      };
    }
    if (customTheme.input) {
      theme.input = {
        ...theme.input,
        background: customTheme.input,
        border: customTheme.secondary || theme.secondary.main,
      };
    }
    if (customTheme.inputFillTreatment !== undefined) {
      theme.input.fillTreatment = customTheme.inputFillTreatment;
    }
    if (customTheme.primary) {
      theme.primary = {
        main: customTheme.primary,
      };
    }
    if (customTheme.secondary) {
      theme.secondary = {
        main: customTheme.secondary,
      };
    }
    if (customTheme.text) {
      theme.text.primary = customTheme.text;
    }
    if (customTheme.textSecondary) {
      theme.text.secondary = customTheme.textSecondary;
    }
    if (customTheme.error) {
      theme.error = {
        main: customTheme.error,
      };
    }
    if (customTheme.success) {
      theme.success = {
        main: customTheme.success,
      };
    }

    const primary = Color(customTheme.primary || theme.primary.main);
    let primaryText: string;
    let disabled: string;
    let disabledText: string;
    let action: string;
    let actionText: string;
    let hover: string;

    if (primary.isDark()) {
      primaryText = primary.lightness(95).hex();
      disabled = primary.alpha(0.5).hexa();
      disabledText = primary.lightness(95).alpha(0.9).hexa();
      action = primary.darken(0.15).hex();
      actionText = primary.lightness(80).hex();
      hover = primary.darken(0.05).hex();
    } else {
      primaryText = primary.lightness(5).hex();
      disabled = primary.alpha(0.5).hexa();
      disabledText = primary.lightness(5).alpha(0.9).hexa();
      action = primary.lighten(0.05).hex();
      actionText = primary.lightness(0).hex();
      hover = primary.lighten(0.05).hex();
    }

    theme.button = {
      primary: primary.hex(),
      primaryText,
      disabled,
      disabledText,
      action,
      actionText,
      hover,
    };
  }

  return createTheme({
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
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
