import React, { forwardRef } from 'react';
import { styled } from '@mui/material';
import { default as MUIButton, ButtonProps } from '@mui/material/Button';

const StyledPrimaryButton = styled(MUIButton)<ButtonProps>({
  padding: '8px 16px',
  borderRadius: '8px',
  height: '48px',
  margin: 'auto',
  maxWidth: '420px',
  width: '100%',
  boxShadow: 'none',
});

const StyledErrorButton = styled(MUIButton)<ButtonProps>({
  padding: '8px 16px',
  borderRadius: '8px',
  height: '48px',
  margin: 'auto',
  maxWidth: '420px',
  width: '100%',
  boxShadow: 'none',
});

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
    return (
      <StyledPrimaryButton
        ref={ref}
        variant="contained"
        {...rest}
        sx={{
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
        }}
      />
    );
  } else if (variant === 'error') {
    return (
      <StyledErrorButton
        ref={ref}
        variant="contained"
        {...rest}
        sx={{
          backgroundColor: 'error.main',
          color: 'error.contrastText',
          '&:disabled': {
            backgroundColor: 'error.main',
            color: 'error.contrastText',
            opacity: 0.4,
          },
        }}
      />
    );
  }

  return <MUIButton ref={ref} {...rest} />;
});

export default Button;
