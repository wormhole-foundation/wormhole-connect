import { Box, useTheme } from '@mui/material';
import { Typography } from '@mui/material';
import React from 'react';

const TokenSectionHeader = ({ label }: { label: string }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        padding: `${theme.spacing(1)} 16px 4px 16px`,
        background: theme.palette.input.background,
        transition: 'background-color 150ms ease',
      }}
    >
      <Typography fontSize={14} color={theme.palette.text.secondary}>
        {label}
      </Typography>
    </Box>
  );
};

export default TokenSectionHeader;
