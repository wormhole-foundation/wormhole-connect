import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import FastestRoute from 'icons/FastestRoute';
import CheapestRoute from 'icons/CheapestRoute';

type Props = {
  isFastest?: boolean;
  isCheapest?: boolean;
  isOnlyChoice?: boolean;
};

const RouteBadge = ({ isFastest, isCheapest, isOnlyChoice }: Props) => {
  const theme = useTheme();

  if (isFastest) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FastestRoute
          sx={{
            width: '16px',
            height: '16px',
            marginRight: '4px',
            fill: theme.palette.primary.main,
          }}
        />
        <Typography component="span" fontSize="14px" lineHeight="14px">
          {isOnlyChoice ? 'Fast' : 'Fastest'}
        </Typography>
      </Box>
    );
  }

  if (isCheapest && !isOnlyChoice) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CheapestRoute
          sx={{
            width: '16px',
            height: '16px',
            marginRight: '4px',
            color: theme.palette.primary.main,
          }}
        />
        <Typography component="span" fontSize="14px" lineHeight="14px">
          Cheapest
        </Typography>
      </Box>
    );
  }

  return null;
};

export default React.memo(RouteBadge);
