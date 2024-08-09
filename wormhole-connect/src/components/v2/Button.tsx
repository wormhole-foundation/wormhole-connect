import React from 'react';
import { styled } from '@mui/material';
import { default as MUIButton, ButtonProps } from '@mui/material/Button';

const PrimaryButton = styled(MUIButton)<ButtonProps>(({ theme }) => ({
  color: theme.palette.getContrastText('#C1BBF6'),
  backgroundColor: '#C1BBF6',
  '&:hover': {
    backgroundColor: '#C1BBF6',
  },
  '&:disabled': {
    backgroundColor: '#C1BBF6',
    color: '#1F2935',
    opacity: '40%',
  },
}));

const ErrorButton = styled(MUIButton)<ButtonProps>(({ theme }) => ({
  color: '#17171D',
  backgroundColor: '#F16576',
  '&:hover': {
    backgroundColor: '#F16576',
  },
  '&:disabled': {
    backgroundColor: '#F16576',
    color: '#17171D',
    opacity: '40%',
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
