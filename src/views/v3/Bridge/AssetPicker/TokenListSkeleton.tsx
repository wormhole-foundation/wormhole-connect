import React, { useMemo } from 'react';
import {
  Box,
  Skeleton,
  Stack,
  ListItemButton,
  ListItemIcon,
} from '@mui/material';

const TokenListSkeleton = () => {
  const styles = useMemo(
    () => ({
      skeletonItem: {
        borderRadius: '8px',
        marginTop: '4px',
      },
    }),
    [],
  );

  return (
    <Box>
      {Array.from({ length: 6 }).map((_, index) => (
        <ListItemButton
          key={index}
          dense
          disabled
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: 0,
            cursor: 'default',
          }}
        >
          {/* Left side: Token icon and details */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '2px 0',
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, marginRight: '20px' }}>
              {/* Token icon skeleton - matches TokenIcon 36px size */}
              <Skeleton variant="circular" width="36px" height="36px" />
            </ListItemIcon>

            {/* Token info skeleton */}
            <Box>
              {/* Token symbol/name */}
              <Skeleton
                variant="rounded"
                width="100px"
                height="14px"
                sx={styles.skeletonItem}
              />
              {/* Token address */}
              <Skeleton
                variant="rounded"
                width="120px"
                height="14px"
                sx={styles.skeletonItem}
              />
            </Box>
          </Box>

          {/* Right side: Balance skeleton - matches TokenBalance component */}
          <Box>
            <Stack alignItems="flex-end">
              <Skeleton
                variant="rounded"
                height="14px"
                width="100px"
                sx={styles.skeletonItem}
              />
              <Skeleton
                variant="rounded"
                height="14px"
                width="80px"
                sx={styles.skeletonItem}
              />
            </Stack>
          </Box>
        </ListItemButton>
      ))}
    </Box>
  );
};

export default TokenListSkeleton;
