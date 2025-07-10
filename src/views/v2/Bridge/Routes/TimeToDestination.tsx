import React from 'react';
import { useTheme } from '@mui/material';

import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { millisToHumanString } from 'utils';

interface TimeToDestinationProps {
  destChain: string | undefined;
  eta: number;
}

function TimeToDestination({ destChain, eta }: TimeToDestinationProps) {
  const theme = useTheme();

  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography
        color={theme.palette.text.secondary}
        component="div"
        fontSize="14px"
        lineHeight="14px"
      >
        Time to {destChain}
      </Typography>
      <Typography
        component="div"
        fontSize="14px"
        lineHeight="14px"
        sx={{
          color:
            eta < 60 * 1000
              ? theme.palette.success.main
              : theme.palette.text.primary,
        }}
      >
        {millisToHumanString(eta)}
      </Typography>
    </Stack>
  );
}

export default React.memo(TimeToDestination);
