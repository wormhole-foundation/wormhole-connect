import { Box, useTheme } from '@mui/material';
import React, { type JSX, useMemo } from 'react';
import { OPACITY } from 'utils/style';

export function FormContent({
  children,
}: {
  children: null | JSX.Element | (JSX.Element | string | null)[];
}) {
  const theme: any = useTheme();
  const styles = useMemo(
    () => ({
      formContent: {
        backgroundColor: theme.palette.formContainer.background + OPACITY[25],
        border: `1px solid ${theme.palette.formContainer.border + OPACITY[25]}`,
        borderRadius: '8px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        width: '488px',
        gap: '16px',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', // Safari support
        [theme.breakpoints.down('sm')]: {
          padding: '8px 4px',
          width: 'auto',
        },
      },
    }),
    [
      theme.palette.formContainer.background,
      theme.palette.formContainer.border,
      theme.breakpoints,
    ],
  );
  return <Box sx={styles.formContent}>{children}</Box>;
}
