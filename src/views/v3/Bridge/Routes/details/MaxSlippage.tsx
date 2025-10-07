import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import React from 'react';
import { useTheme } from '@mui/material/styles';

export interface MaxSlippageProps {
  slippage?: number;
}

export default function MaxSlippage({ slippage }: MaxSlippageProps) {
  const theme = useTheme();
  if (!slippage) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        marginTop: '0px',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(4),
      }}
    >
      <Typography
        variant="body2"
        fontWeight={500}
        fontSize={12}
        color={theme.palette.text.primary}
        sx={{ display: 'block', opacity: 0.5 }}
      >
        Max slippage
      </Typography>
      <Typography
        variant="body2"
        fontSize={12}
        fontWeight={600}
        color={theme.palette.text.primary}
        sx={{ display: 'block', opacity: 0.5 }}
      >
        {/* Convert bps to percentage */}
        {slippage ? `${slippage / 100}%` : null}
      </Typography>
    </Box>
  );
}
