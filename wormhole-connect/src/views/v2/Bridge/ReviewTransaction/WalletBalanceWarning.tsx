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

  return (
    <Stack direction="column" gap="10px">
      <AlertBanner
        warning={true}
        content={
          !isCheckingBalance &&
          `Insufficient ${feeSymbol} to cover network costs.`
        }
        show={!!isCheckingBalance || !hasSufficientBalance}
        testId="wallet-balance-warning-message"
      />
      {!hasSufficientBalance && !isCheckingBalance && (
        <Stack>
          {[
            { title: 'Wallet balance', balance: walletBalance! },
            { title: 'Network cost', balance: networkCost! },
          ].map((item) => (
            <Stack
              key={item.title}
              direction="row"
              justifyContent="space-between"
            >
              <Typography color={theme.palette.text.secondary} fontSize={14}>
                {item.title}
              </Typography>
              <Typography color={theme.palette.text.secondary} fontSize={14}>
                {isNaN(item.balance)
                  ? '-'
                  : `${toFixedDecimals(
                      item.balance.toString(),
                      4,
                    )} ${feeSymbol}`}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
