import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import React from 'react';
import { toFixedDecimals } from 'utils/balance';

export interface MinOutputProps {
  minOutput?: number;
  outputToken?: string;
}

const MIN_OUTPUT_DISPLAY_DECIMALS = 4;
export default function MinOutput({ minOutput, outputToken }: MinOutputProps) {
  const theme = useTheme();
  if (!minOutput || !outputToken) {
    return null;
  }
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(5),
      }}
    >
      <Typography
        variant="body2"
        fontSize={12}
        fontWeight={500}
        color={theme.palette.text.primary}
        sx={{ display: 'block', opacity: 0.5 }}
      >
        Minimum output
      </Typography>
      <Typography
        variant="body2"
        fontSize={12}
        fontWeight={600}
        color={theme.palette.text.primary}
        sx={{ display: 'block', opacity: 0.5 }}
      >
        {toFixedDecimals(minOutput.toString(), MIN_OUTPUT_DISPLAY_DECIMALS)}{' '}
        {outputToken}
      </Typography>
    </Box>
  );
}
