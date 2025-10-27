import React, { useMemo } from 'react';
import {
  Button as MUIButton,
  type ButtonProps as MUIButtonProps,
  type SxProps,
  type Theme,
} from '@mui/material';

type ButtonVariant = 'primary' | 'error' | 'default';

interface CustomButtonProps extends Omit<MUIButtonProps, 'variant' | 'sx'> {
  readonly variant?: ButtonVariant;
  readonly styleOverrides?: SxProps<Theme>;
}

const BASE_BUTTON_STYLES: SxProps<Theme> = {
  padding: '8px 16px',
  borderRadius: '48px',
  height: '48px',
  margin: 'auto',
  maxWidth: '420px',
  width: '100%',
  boxShadow: 'none',
} as const;

const PRIMARY_BUTTON_STYLES: SxProps<Theme> = {
  backgroundColor: (theme) => theme.palette.button.primary,
  color: (theme) => theme.palette.button.primaryText,
  '&.Mui-disabled': {
    backgroundColor: (theme) => theme.palette.button.disabled,
    color: (theme) => theme.palette.button.disabledText,
  },
  '&:hover': {
    boxShadow: 'none',
    backgroundColor: (theme) => theme.palette.button.hover,
    '&:disabled': {
      backgroundColor: (theme) => theme.palette.button.disabled,
      color: (theme) => theme.palette.button.disabledText,
    },
  },
  '&:active': {
    boxShadow: 'none',
    backgroundColor: (theme) => theme.palette.button.action,
    color: (theme) => theme.palette.button.actionText,
  },
} as const;

const ERROR_BUTTON_STYLES: SxProps<Theme> = {
  backgroundColor: (theme) => theme.palette.error.main,
  color: (theme) => theme.palette.error.contrastText,
  '&:disabled': {
    backgroundColor: (theme) => theme.palette.error.main,
    color: (theme) => theme.palette.error.contrastText,
    opacity: 0.4,
  },
} as const;

// Style variants mapping
const VARIANT_STYLES = {
  primary: PRIMARY_BUTTON_STYLES,
  error: ERROR_BUTTON_STYLES,
} as const;

/**
 * Custom Button component that extends MUI Button with predefined variants
 *
 * @param variant - The style variant of the button:
 *   - 'primary': Main CTA button with primary colors
 *   - 'error': Error state button with error colors
 *   - 'default': Standard MUI button (fallback)
 * @param styleOverrides - Additional style overrides
 * @param rest - All other MUI Button props
 *
 * @returns A styled button component
 */
const Button = ({
  variant = 'default',
  styleOverrides,
  ...rest
}: CustomButtonProps) => {
  const computedStyles = useMemo((): SxProps<Theme> => {
    // Handle default variant separately
    if (variant === 'default') {
      return styleOverrides ?? {};
    }

    // Get variant styles (we know it exists for 'primary' and 'error')
    const variantStyles =
      VARIANT_STYLES[variant as keyof typeof VARIANT_STYLES];

    // Type assertion to help TypeScript understand the filtered array is still valid SxProps
    return [BASE_BUTTON_STYLES, variantStyles, styleOverrides].filter(
      Boolean,
    ) as SxProps<Theme>;
  }, [variant, styleOverrides]);

  // Determine MUI variant based on custom variant
  const muiVariant: MUIButtonProps['variant'] =
    variant === 'primary' || variant === 'error' ? 'contained' : 'text';

  return <MUIButton variant={muiVariant} sx={computedStyles} {...rest} />;
};

export default Button;
