export {};
import '@mui/material/styles';
import type {
  PaletteColor,
  PaletteColorOptions,
  TypeBackground as MuiTypeBackground,
  TypeText as MuiTypeText,
} from '@mui/material/styles';
import type { InternalTheme } from 'theme';

type TextFromInternal = InternalTheme['text'];

declare module '@mui/material/styles' {
  interface TypeText extends MuiTypeText, TextFromInternal {
    tertiary: string;
  }

  interface TypeBackground extends MuiTypeBackground {
    form?: string;
  }

  interface Palette {
    primary: PaletteColor;
    secondary: PaletteColor;
    error: PaletteColor;
    warning: PaletteColor;
    info: PaletteColor;
    success: PaletteColor;

    divider: string;
    background: TypeBackground;
    text: TypeText;

    button: {
      primary: string;
      primaryText: string;
      disabled: string;
      disabledText: string;
      action: string;
      actionText: string;
      hover: string;
    };
    options: { hover: string; select: string };
    card: { background: string; secondary: string; elevation: string };
    popover: { background: string; secondary: string; elevation: string };
    input: { background: string; border: string; fillTreatment: boolean };
    logo: string;
  }

  interface PaletteOptions {
    primary?: PaletteColorOptions;
    secondary?: PaletteColorOptions;
    error?: PaletteColorOptions;
    warning?: PaletteColorOptions;
    info?: PaletteColorOptions;
    success?: PaletteColorOptions;

    divider?: string;
    background?: Partial<TypeBackground>;
    text?: Partial<TypeText>;

    button?: {
      primary: string;
      primaryText: string;
      disabled: string;
      disabledText: string;
      action: string;
      actionText: string;
      hover: string;
    };
    options?: { hover: string; select: string };
    card?: { background: string; secondary: string; elevation: string };
    popover?: { background: string; secondary: string; elevation: string };
    input?: { background: string; border: string; fillTreatment: boolean };
    logo?: string;
  }
}
