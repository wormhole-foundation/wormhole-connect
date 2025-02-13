import React, { forwardRef } from 'react';
import { styled } from '@mui/material';
import { default as MUIButton, ButtonProps } from '@mui/material/Button';

const PrimaryButton = styled(MUIButton)<ButtonProps>(
  ({ theme }: { theme: any }) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    height: '48px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
    boxShadow: 'none',
    backgroundColor: theme.palette.button.primary,
    color: theme.palette.button.primaryText,
    '&:disabled': {
      backgroundColor: theme.palette.button.disabled,
      color: theme.palette.button.disabledText,
    },
    '&:hover': {
      boxShadow: 'none',
      backgroundColor: theme.palette.button.hover,
    },
    '&:active': {
      boxShadow: 'none',
      backgroundColor: theme.palette.button.action,
      color: theme.palette.button.actionText,
    },
  }),
);

const ErrorButton = styled(MUIButton)<ButtonProps>(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,

  '&:disabled': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    opacity: 0.4,
  },
}));

type Props = Omit<ButtonProps, 'variant'> & { variant?: string };

/**
 * Custom Button component that extends MUI Button
 * @param variant:  Optional propoerty to specify the style variant of the button
 *                  Primary: The main CTA
 *
 */
const Button = forwardRef<HTMLButtonElement, Props>((props: Props, ref) => {
  const { variant, ...rest } = props;

  if (variant === 'primary') {
    return <PrimaryButton ref={ref} variant="contained" {...rest} />;
  } else if (variant === 'error') {
    return <ErrorButton ref={ref} variant="contained" {...rest} />;
  }

  return <MUIButton {...rest} />;
});

export default Button;
