import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Button, Typography, useTheme } from '@mui/material';
import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount, isSameToken } from '@wormhole-foundation/sdk';

import config from 'config';
import type { RootState } from 'store';
import { calculateFeeOffset } from 'utils/fees';
import { getGasReserve } from 'utils/gasReserve';
import { getGasToken } from 'utils';
import { useGetTokens } from 'hooks/useGetTokens';

type Props = {
  tokenBalance: sdkAmount.Amount | null;
  chain?: Chain;
  isTransactionInProgress: boolean;
  selectedPercent: number;
  onAmountChange: (amount: string) => void;
  onDebouncedAmountChange: (amount: string) => void;
  onPercentSelect: (percent: number) => void;
};

const PERCENT_VALUES = [25, 50, 100];

function PercentButtons(props: Props) {
  const theme: any = useTheme();
  const { route: selectedRoute } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { sourceToken, destToken } = useGetTokens();

  const styles = useMemo(
    () => ({
      percentButton: {
        borderRadius: '50px',
        color: theme.palette.text.primary,
        height: '22px',
        minWidth: '36px',
        padding: '0 8px',
        opacity: 0.7,
      },
      percentButtonSelected: {
        color: theme.palette.formContainer.background,
        backgroundColor: theme.palette.primary.main,
        opacity: 'unset',
      },
    }),
    [theme],
  );

  const renderPercentButton = useCallback(
    (percent: number) => (
      <Button
        sx={{
          ...styles.percentButton,
          ...(props.selectedPercent === percent
            ? styles.percentButtonSelected
            : {}),
        }}
        disabled={props.isTransactionInProgress}
        onClick={() => {
          if (props.tokenBalance) {
            // Calculate the desired amount for the selected percentage
            let amountInBaseUnits =
              (sdkAmount.units(props.tokenBalance) * BigInt(percent)) /
              BigInt(100);

            if (percent === 100) {
              // User clicks "Max" when fee-offsetting is enabled.
              // We need to subtract the fee offset amount from the balance
              // This is to ensure user doesn't get insufficient funds error when fee offset is applied
              // 1. Fee offset for referral fees
              if (
                config.ui?.experimental?.feeOffsetting &&
                selectedRoute &&
                sourceToken &&
                destToken
              ) {
                const feeOffset = calculateFeeOffset(
                  config.routes.get(selectedRoute),
                  props.tokenBalance,
                  sourceToken,
                  destToken,
                );
                if (feeOffset) {
                  amountInBaseUnits -= sdkAmount.units(feeOffset);
                }
              }

              // 2. Gas reserve for gas tokens
              if (sourceToken && props.chain) {
                try {
                  const gasToken = getGasToken(props.chain);
                  if (isSameToken(sourceToken, gasToken)) {
                    const gasReserve = getGasReserve(
                      props.chain,
                      props.tokenBalance.decimals,
                    );
                    if (gasReserve) {
                      amountInBaseUnits -= sdkAmount.units(gasReserve);

                      // If balance is insufficient after subtracting gas reserve, don't set amount
                      if (amountInBaseUnits <= 0n) {
                        return;
                      }
                    }
                  }
                } catch {
                  // Gas token not found for chain, proceed without reserve
                }
              }
            }

            const displayAmount = sdkAmount.display(
              sdkAmount.fromBaseUnits(
                amountInBaseUnits,
                props.tokenBalance.decimals,
              ),
            );
            props.onAmountChange(displayAmount);
            props.onDebouncedAmountChange(displayAmount);
            props.onPercentSelect(percent);
          }
        }}
      >
        <Typography fontSize={12} fontWeight={600} textTransform="none">
          {percent === 100 ? 'Max' : `${percent}%`}
        </Typography>
      </Button>
    ),
    [
      styles.percentButton,
      styles.percentButtonSelected,
      props,
      selectedRoute,
      sourceToken,
      destToken,
    ],
  );

  return (
    <Box sx={{ display: 'flex', gap: '6px' }}>
      {PERCENT_VALUES.map((percent) => (
        <React.Fragment key={percent}>
          {renderPercentButton(percent)}
        </React.Fragment>
      ))}
    </Box>
  );
}

export default React.memo(PercentButtons);
