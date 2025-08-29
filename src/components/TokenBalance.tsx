import React from 'react';
import { Stack, Typography, CircularProgress } from '@mui/material';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { useTheme } from '@mui/material/styles';

const TokenBalance = ({
  balance,
  isSource,
  isFetching,
  price,
}: {
  balance: sdkAmount.Amount | null;
  isSource?: boolean;
  isFetching?: boolean;
  price?: string | null;
}) => {
  const theme = useTheme();

  if (isFetching && balance === null) {
    return (
      <Stack alignItems="flex-end">
        <Typography fontSize={14}>
          <CircularProgress size={24} />
        </Typography>
      </Stack>
    );
  }

  const shouldHideBalance =
    !isSource && balance && sdkAmount.display(balance) === '0';

  return (
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
  );
};

export default TokenBalance;
