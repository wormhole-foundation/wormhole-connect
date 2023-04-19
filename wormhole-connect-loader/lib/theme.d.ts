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
export declare const dark: {
    primary: {
        50: "#fafafa";
        100: "#f5f5f5";
        200: "#eeeeee";
        300: "#e0e0e0";
        400: "#bdbdbd";
        500: "#9e9e9e";
        600: "#757575";
        700: "#616161";
        800: "#424242";
        900: "#212121";
        A100: "#f5f5f5";
        A200: "#eeeeee";
        A400: "#bdbdbd";
        A700: "#616161";
    };
    secondary: {
        50: "#fafafa";
        100: "#f5f5f5";
        200: "#eeeeee";
        300: "#e0e0e0";
        400: "#bdbdbd";
        500: "#9e9e9e";
        600: "#757575";
        700: "#616161";
        800: "#424242";
        900: "#212121";
        A100: "#f5f5f5";
        A200: "#eeeeee";
        A400: "#bdbdbd";
        A700: "#616161";
    };
    divider: string;
    background: {
        default: string;
    };
    text: {
        primary: string;
        secondary: "#9e9e9e";
    };
    error: {
        50: "#ffebee";
        100: "#ffcdd2";
        200: "#ef9a9a";
        300: "#e57373";
        400: "#ef5350";
        500: "#f44336";
        600: "#e53935";
        700: "#d32f2f";
        800: "#c62828";
        900: "#b71c1c";
        A100: "#ff8a80";
        A200: "#ff5252";
        A400: "#ff1744";
        A700: "#d50000";
    };
    info: {
        50: "#e1f5fe";
        100: "#b3e5fc";
        200: "#81d4fa";
        300: "#4fc3f7";
        400: "#29b6f6";
        500: "#03a9f4";
        600: "#039be5";
        700: "#0288d1";
        800: "#0277bd";
        900: "#01579b";
        A100: "#80d8ff";
        A200: "#40c4ff";
        A400: "#00b0ff";
        A700: "#0091ea";
    };
    success: {
        50: "#e8f5e9";
        100: "#c8e6c9";
        200: "#a5d6a7";
        300: "#81c784";
        400: "#66bb6a";
        500: "#4caf50";
        600: "#43a047";
        700: "#388e3c";
        800: "#2e7d32";
        900: "#1b5e20";
        A100: "#b9f6ca";
        A200: "#69f0ae";
        A400: "#00e676";
        A700: "#00c853";
    };
    warning: {
        50: "#fff3e0";
        100: "#ffe0b2";
        200: "#ffcc80";
        300: "#ffb74d";
        400: "#ffa726";
        500: "#ff9800";
        600: "#fb8c00";
        700: "#f57c00";
        800: "#ef6c00";
        900: "#e65100";
        A100: "#ffd180";
        A200: "#ffab40";
        A400: "#ff9100";
        A700: "#ff6d00";
    };
    button: {
        primary: string;
        primaryText: string;
        disabled: string;
        disabledText: string;
        action: "#ffb74d";
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
    modal: {
        background: string;
    };
};
export declare const defaultTheme: Theme;
