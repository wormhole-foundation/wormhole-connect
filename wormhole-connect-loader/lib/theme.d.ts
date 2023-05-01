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
export type Theme = {
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
    modal: {
        background: string;
    };
    font: {
        primary: string;
        header: string;
    };
};
export declare const OPACITY: {
    0: string;
    5: string;
    7: string;
    10: string;
    15: string;
    20: string;
    25: string;
    30: string;
    35: string;
    40: string;
    45: string;
    50: string;
    55: string;
    60: string;
    65: string;
    70: string;
    75: string;
    80: string;
    85: string;
    90: string;
    95: string;
    100: string;
};
export declare const light: Theme;
export declare const dark: Theme;
export declare const defaultTheme: Theme;
