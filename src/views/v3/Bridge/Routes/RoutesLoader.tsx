import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const RoutesLoader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '54px',
        width: '100%',
        gap: '12px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          height: '20px',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Skeleton
          variant="rounded"
          height={20}
          width="70%"
          sx={{ borderRadius: '20px' }}
        />
        <Skeleton
          variant="rounded"
          height={20}
          width="25%"
          sx={{ borderRadius: '20px' }}
        />
      </Box>
      <Skeleton
        variant="rounded"
        height={20}
        width="100%"
        sx={{ borderRadius: '20px' }}
      />
    </Box>
  );
};

export default React.memo(RoutesLoader);
