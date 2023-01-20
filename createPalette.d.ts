import * as createPalette from '@mui/material/styles/createPalette';
declare module '@mui/material/styles/createPalette' {
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
      }
      card?: {
        background: string;
        elevation: string;
      };
    }
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
      }
      card: {
        background: string;
        elevation: string;
      };
  }
}