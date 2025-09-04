import { Box, useTheme } from '@mui/material';

import { Typography } from '@mui/material';
import React from 'react';

const TokenSectionHeader = ({
  index,
  ownedCount,
  isGroupingEnabled,
}: {
  index: number;
  ownedCount: number;
  isGroupingEnabled: boolean;
}) => {
  const theme = useTheme();

  return (
    <>
      {isGroupingEnabled && index === 0 && ownedCount > 0 && (
        <Box sx={{ padding: '4px 16px' }}>
          <Typography fontSize={14} color={theme.palette.text.secondary}>
            Your tokens
          </Typography>
        </Box>
      )}
      {isGroupingEnabled && index === ownedCount && (
        <Box sx={{ padding: '4px 16px' }}>
          <Typography fontSize={14} color={theme.palette.text.secondary}>
            All tokens
          </Typography>
        </Box>
      )}
    </>
  );
};

export default TokenSectionHeader;
