import React from 'react';
import { styled } from '@mui/material';
import { default as MUIButton, ButtonProps } from '@mui/material/Button';

const PrimaryButton = styled(MUIButton)<ButtonProps>(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,

  '&:disabled': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    opacity: 0.4,
  },
}));

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
const Button = (props: Props) => {
  const { variant, ...rest } = props;

  if (variant === 'primary') {
    return <PrimaryButton variant="contained" {...rest} />;
  } else if (variant === 'error') {
    return <ErrorButton variant="contained" {...rest} />;
  }

  return <MUIButton {...rest} />;
};

export default Button;
