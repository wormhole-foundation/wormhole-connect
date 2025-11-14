import { createTheme } from '@mui/material/styles';
import type { PaletteMode, Theme } from '@mui/material';
import { OPACITY } from './utils/style';
import Color from 'color';

export type WormholeConnectTheme = {
  // "dark" or "light"
  mode: PaletteMode;
  // Background of surrounding application
  background?: string;
  // Background of the container surrounding form fields (asset pickers, amount input and confirm button)
  formBackground?: string;
  // Border of the container surrounding form fields (asset pickers, amount input and confirm button)
  formBorder?: string;
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

export type InternalTheme = {
  mode: PaletteMode;
  primary: Color;
  secondary: Color;
  divider: string;
  background: { default: string };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
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
  icon: {
    primary: string;
    secondary: string;
  };
  toggle: {
    background: string;
    text: string;
    active: string;
    activeText: string;
  };
  formContainer: {
    background: string;
    border: string;
  };
  font: string;
  logo: string;
};

export const light: InternalTheme = {
  mode: 'light',
  primary: { main: '#A89EFF' },
  secondary: { main: '#cccccc' },
  divider: '#a0a2a9',
  background: {
    default: 'transparent',
  },
  text: {
    primary: '#3F3F46',
    secondary: '#71717B',
    tertiary: '#9F9FA9',
    accent: '#9891DA',
  },
  error: { main: '#f44336' },
  info: {
    main: '#A4C8F3',
  },
  success: { main: '#4caf50' },
  warning: { main: '#ff9800' },
  button: {
    primary: '#A89EFF',
    primaryText: '#F9F9FB',
    disabled: '#F3F4F6',
    disabledText: '#99A1AF',
    action: '#A89EFF',
    actionText: '#F9F9FB',
    hover: '#A89EFF',
  },
  options: {
    hover: '#f9f9fb',
    select: '#F0F0F5',
  },
  card: {
    background: '#F0F0F5',
    elevation: '10px 10px 30px 15px #CCD2E7',
    secondary: '#F0F0F5',
  },
  popover: {
    background: '#FFFFFF',
    elevation: '10px 10px 30px 15px #CCD2E7',
    secondary: '#F0F0F5',
  },
  input: {
    background: '#F9F9FB',
    border: '#E8E6F0',
    fillTreatment: true,
  },
  icon: {
    primary: '#101828',
    secondary: '#99A1AF',
  },
  toggle: {
    background: '#E5E7EB',
    text: '#71717B',
    active: '#A89EFF',
    activeText: '#FFFFFF',
  },
  formContainer: {
    background: '#FBFAF9',
    border: '#E4E4E7',
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
  },
  text: {
    primary: '#ffffff',
    secondary: '#71717B',
    tertiary: '#52525C',
    accent: '#ffffff',
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
    primary: '#AFA7F6',
    primaryText: '#12111A',
    disabled: '#3F3F46',
    disabledText: '#71717B',
    action: '#AFA7F6',
    actionText: '#12111A',
    hover: '#9891DA',
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
    background: '#18181B',
    border: '#3F3F46',
    fillTreatment: true,
  },
  icon: {
    primary: '#F9FAFB',
    secondary: '#6A7282',
  },
  toggle: {
    background: '#18181B',
    text: '#9F9FA9',
    active: '#3C3A50',
    activeText: '#F4F4F5',
  },
  formContainer: {
    background: '#0E0D12',
    border: '#333333',
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
      const buttonPrimary = Color(customTheme.primary || theme.primary.main);
      let primaryText: string;
      let disabled: string;
      let disabledText: string;
      let action: string;
      let actionText: string;
      let hover: string;

      if (buttonPrimary.isDark()) {
        primaryText = buttonPrimary.lightness(95).hex();
        disabled = buttonPrimary.alpha(0.5).hexa();
        disabledText = buttonPrimary.lightness(95).alpha(0.9).hexa();
        action = buttonPrimary.darken(0.15).hex();
        actionText = buttonPrimary.lightness(80).hex();
        hover = buttonPrimary.darken(0.05).hex();
      } else {
        primaryText = buttonPrimary.lightness(5).hex();
        disabled = buttonPrimary.alpha(0.5).hexa();
        disabledText = buttonPrimary.lightness(5).alpha(0.9).hexa();
        action = buttonPrimary.lighten(0.05).hex();
        actionText = buttonPrimary.lightness(0).hex();
        hover = buttonPrimary.lighten(0.05).hex();
      }

      theme.button = {
        primary: buttonPrimary.hex(),
        primaryText,
        disabled,
        disabledText,
        action,
        actionText,
        hover,
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
    if (customTheme.formBackground) {
      theme.formContainer = {
        ...theme.formContainer,
        background:
          customTheme.formBackground || theme.formContainer.background,
      };
    }
    if (customTheme.formBorder) {
      theme.formContainer = {
        ...theme.formContainer,
        border: customTheme.formBorder || theme.formContainer.border,
      };
    }
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
