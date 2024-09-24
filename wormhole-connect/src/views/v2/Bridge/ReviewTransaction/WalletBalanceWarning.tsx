import React from 'react';
import AlertBanner from 'components/v2/AlertBanner';
import { Stack, Typography, useTheme } from '@mui/material';
import { toFixedDecimals } from 'utils/balance';

export type WalletBalanceWarningProps = {
  isCheckingBalance: boolean;
  isBalanceEnough: boolean;
  walletBalance?: number;
  networkCost?: number;
  symbol?: string;
};

export default function WalletBalanceWarning({
  isCheckingBalance,
  isBalanceEnough,
  walletBalance,
  networkCost,
  symbol,
}: WalletBalanceWarningProps) {
  const theme = useTheme();
  const content = isCheckingBalance
    ? `Checking if wallet balance is enough...`
    : `Your wallet balance is not enough to cover the network cost. Please add more funds to your wallet.`;

  return (
    <Stack direction="column" gap="10px">
      <AlertBanner
        warning
        content={content}
        show={!!isCheckingBalance || !isBalanceEnough}
        testId="wallet-balance-warning-message"
      />
      {!isBalanceEnough && !isCheckingBalance && (
        <Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              Wallet balance
            </Typography>
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              {!!walletBalance &&
                `${toFixedDecimals(walletBalance.toString(), 4)} ${symbol}`}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              Network cost
            </Typography>
            <Typography color={theme.palette.text.secondary} fontSize={14}>
              {!!networkCost &&
                `${toFixedDecimals(networkCost.toString(), 4)} ${symbol}`}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
