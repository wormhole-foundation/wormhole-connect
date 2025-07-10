import React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import ClockIcon from 'icons/Clock';
import { millisToHumanString } from 'utils';

interface EtaProps {
  eta?: number;
}

function Eta({ eta }: EtaProps) {
  const theme: any = useTheme();

  if (!eta) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        fontSize: '14px',
        justifyContent: 'flex-end',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          height: '32px',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 0',
        }}
      >
        <ClockIcon
          sx={{
            color: '#7A8390',
            width: '12px',
            height: '12px',
          }}
        />
        <Typography
          component="span"
          color={theme.palette.text.primary}
          fontSize="14px"
          lineHeight="14px"
        >
          {millisToHumanString(eta)}
        </Typography>
      </Box>
    </Box>
  );
}

export default React.memo(Eta);
