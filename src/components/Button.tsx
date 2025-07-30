import type { MouseEvent, MouseEventHandler } from 'react';
import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';

type Props = {
  action?: boolean;
  elevated?: boolean;
  link?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  testId?: string;
};

function Button(props: Props) {
  const theme = useTheme();
  const styles = useMemo(
    () => ({
      button: {
        width: '100%',
        backgroundColor: theme.palette.button.primary,
        color: theme.palette.button.primaryText,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 64px',
        cursor: 'pointer',
        textAlign: 'center',
      },
      disabled: {
        cursor: 'not-allowed',
        pointerEvents: 'none',
        backgroundColor: `${theme.palette.button.disabled} !important`,
        color: `${theme.palette.button.disabledText} !important`,
      },
      elevated: {
        boxShadow: theme.palette.card.elevation,
      },
      action: {
        backgroundColor: theme.palette.button.action,
        color: theme.palette.button.actionText,
      },
      link: {
        backgroundColor: 'transparent',
      },
    }),
    [theme],
  );

  const click = (e: MouseEvent<HTMLDivElement>) => {
    if (props.onClick && !props.disabled) {
      props.onClick(e);
    }
  };
  return (
    <Box
      sx={[
        styles.button,
        !!props.elevated && styles.elevated,
        !!props.action && styles.action,
        !!props.link && styles.link,
        !!props.disabled && styles.disabled,
      ]}
      onClick={click}
      data-testid={props.testId}
    >
      {props.children}
    </Box>
  );
}

export default Button;
