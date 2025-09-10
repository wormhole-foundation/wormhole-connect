import React from 'react';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { useTheme } from '@mui/material/styles';

const TokenBalance = ({
  balance,
  isFetching,
  price,
}: {
  balance: sdkAmount.Amount | null;
  isFetching?: boolean;
  price?: string | null;
}) => {
  const theme = useTheme();
  const shouldHideBalance = !balance || sdkAmount.display(balance) === '0';
  const containerWidth = 120; // Reserve space to prevent layout shift

  if (isFetching) {
    return (
      <Box sx={{ width: containerWidth }}>
        <Stack alignItems="flex-end">
          <Skeleton
            variant="rounded"
            height={14}
            width="80%"
            sx={{ borderRadius: '8px' }}
          />
          <Skeleton
            variant="rounded"
            height={14}
            width="60%"
            sx={{ borderRadius: '8px', mt: 0.5 }}
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ width: containerWidth }}>
      <Stack alignItems="flex-end">
        <Typography fontSize={14}>
          {balance && !shouldHideBalance
            ? sdkAmount.display(sdkAmount.truncate(balance, 6))
            : ''}
        </Typography>
        {price && !shouldHideBalance && (
          <Typography color={theme.palette.text.secondary} fontSize="10px">
            {price}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default TokenBalance;
