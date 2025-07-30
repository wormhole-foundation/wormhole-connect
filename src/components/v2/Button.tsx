import React, { forwardRef } from 'react';
import type { ButtonProps } from '@mui/material/Button';
import { default as MUIButton } from '@mui/material/Button';

const baseButtonStyles = {
  padding: '8px 16px',
  borderRadius: '8px',
  height: '48px',
  margin: 'auto',
  maxWidth: '420px',
  width: '100%',
  boxShadow: 'none',
};

type Props = Omit<ButtonProps, 'variant'> & { variant?: string };

/**
 * Custom Button component that extends MUI Button
 * @param variant:  Optional propoerty to specify the style variant of the button
 *                  Primary: The main CTA
 *
 */
const Button = forwardRef<HTMLButtonElement, Props>((props: Props, ref) => {
  const { variant, sx, ...rest } = props;

  if (variant === 'primary') {
    return (
      <MUIButton
        ref={ref}
        variant="contained"
        {...rest}
        sx={{
          ...baseButtonStyles,
          backgroundColor: 'button.primary',
          color: 'button.primaryText',
          '&.Mui-disabled': {
            backgroundColor: 'button.disabled',
            color: 'button.disabledText',
          },
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: 'button.hover',
            '&:disabled': {
              backgroundColor: 'button.disabled',
              color: 'button.disabledText',
            },
          },
          '&:active': {
            boxShadow: 'none',
            backgroundColor: 'button.action',
            color: 'button.actionText',
          },
          ...sx,
        }}
      />
    );
  } else if (variant === 'error') {
    return (
      <MUIButton
        ref={ref}
        variant="contained"
        {...rest}
        sx={{
          ...baseButtonStyles,
          backgroundColor: 'error.main',
          color: 'error.contrastText',
          '&:disabled': {
            backgroundColor: 'error.main',
            color: 'error.contrastText',
            opacity: 0.4,
          },
          ...sx,
        }}
      />
    );
  }

  return <MUIButton ref={ref} sx={sx} {...rest} />;
});

export default Button;
