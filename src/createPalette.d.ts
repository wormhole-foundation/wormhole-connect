import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
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
      secondary: string;
      elevation: string;
    };
    popover: {
      background: string;
      secondary: string;
      elevation: string;
    };
    input: {
      background: string;
      border: string;
      fillTreatment: boolean;
    };
    logo: string;
  }

  interface PaletteOptions {
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
      secondary: string;
      elevation: string;
    };
    popover?: {
      background: string;
      secondary: string;
      elevation: string;
    };
    input?: {
      background: string;
      border: string;
      fillTreatment: boolean;
    };
    logo?: string;
  }
}
