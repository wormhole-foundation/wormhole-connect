import React from 'react';
import AlertBanner from 'components/v2/AlertBanner';
import { Stack, Typography, useTheme } from '@mui/material';
import { toFixedDecimals } from 'utils/balance';
import type { useBalanceChecker } from 'hooks/useBalanceChecker';

export default function WalletBalanceWarning({
  isCheckingBalance,
  hasSufficientBalance,
  walletBalance,
  networkCost,
  feeSymbol,
}: ReturnType<typeof useBalanceChecker>) {
  const theme = useTheme();
  const content = isCheckingBalance
    ? 'Checking wallet balance for network costs...'
    : 'Insufficient balance to cover the network costs. Please add more funds to your wallet.';

  return (
    <Stack direction="column" gap="10px">
      <AlertBanner
        warning
        content={content}
        show={!!isCheckingBalance || !hasSufficientBalance}
        testId="wallet-balance-warning-message"
      />
      {!hasSufficientBalance && !isCheckingBalance && (
        <Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              Wallet balance
            </Typography>
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              {!!walletBalance &&
                `${toFixedDecimals(walletBalance.toString(), 4)} ${feeSymbol}`}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              Network cost
            </Typography>
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              {!!networkCost &&
                `${toFixedDecimals(networkCost.toString(), 4)} ${feeSymbol}`}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
