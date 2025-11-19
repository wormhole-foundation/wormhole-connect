import { Box, useMediaQuery, useTheme } from '@mui/material';
import React, { type JSX, useMemo } from 'react';
import { OPACITY } from 'utils/style';

export function FormContent({
  children,
}: {
  children: null | JSX.Element | (JSX.Element | string | null)[];
}) {
  const theme: any = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      },
      formContentMobile: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      },
    }),
    [
      theme.palette.formContainer.background,
      theme.palette.formContainer.border,
    ],
  );
  return (
    <Box
      sx={mobile ? { ...styles.formContentMobile } : { ...styles.formContent }}
    >
      {children}
    </Box>
  );
}
