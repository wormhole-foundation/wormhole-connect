import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ClickAwayListener,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
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

const INSUFFICIENT_FUNDS_MESSAGE =
  "You don't have enough funds in your wallet to cover both this amount and the gas cost of the transfer.";
const GAS_RESERVE_INFO_MESSAGE =
  'A small amount of the network token balance is reserved to cover the network cost of this transaction.';

function PercentButtons(props: Props) {
  const theme: any = useTheme();
  const { route: selectedRoute } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { sourceToken, destToken } = useGetTokens();
  const [showInsufficientTooltip, setShowInsufficientTooltip] = useState<
    number | undefined
  >(undefined);

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

  // Check if the selected token is the gas token for the chain
  const isGasToken = useMemo(() => {
    if (!sourceToken || !props.chain) {
      return false;
    }
    try {
      const gasToken = getGasToken(props.chain);
      return isSameToken(sourceToken, gasToken);
    } catch {
      return false;
    }
  }, [sourceToken, props.chain]);

  // Check if user has insufficient balance for gas reserve
  const hasInsufficientGasReserve = useMemo(() => {
    if (!props.tokenBalance || !props.chain || !isGasToken) {
      return false;
    }

    const gasReserve = getGasReserve(props.chain);
    if (!gasReserve) {
      return false;
    }

    // Disable Max if balance is less than or equal to gas reserve
    return sdkAmount.units(props.tokenBalance) <= sdkAmount.units(gasReserve);
  }, [props.tokenBalance, props.chain, isGasToken]);

  // Calculate the amount for a given percentage
  const calculatePercentAmount = useCallback(
    (percent: number): string | null => {
      if (!props.tokenBalance) {
        return null;
      }

      let amountInBaseUnits =
        (sdkAmount.units(props.tokenBalance) * BigInt(percent)) / BigInt(100);

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
        if (isGasToken && props.chain) {
          const gasReserve = getGasReserve(props.chain);
          if (gasReserve) {
            amountInBaseUnits -= sdkAmount.units(gasReserve);
          }
        }
      }

      return sdkAmount.display(
        sdkAmount.fromBaseUnits(amountInBaseUnits, props.tokenBalance.decimals),
      );
    },
    [
      props.tokenBalance,
      props.chain,
      selectedRoute,
      sourceToken,
      destToken,
      isGasToken,
    ],
  );

  // Handle click on percent button
  const handlePercentClick = useCallback(
    (event: React.MouseEvent, percent: number) => {
      event.stopPropagation();

      // Show tooltip for insufficient balance
      if (hasInsufficientGasReserve && isGasToken) {
        setShowInsufficientTooltip(percent);
        return;
      }

      // Calculate and set amount
      const amount = calculatePercentAmount(percent);
      if (amount) {
        props.onAmountChange(amount);
        props.onDebouncedAmountChange(amount);
        props.onPercentSelect(percent);
      }
    },
    [hasInsufficientGasReserve, isGasToken, calculatePercentAmount, props],
  );

  // Wrap button with appropriate tooltip
  const renderPercentButtonWithTooltip = useCallback(
    (button: React.ReactElement, percent: number) => {
      if (!isGasToken) {
        return button;
      }

      if (hasInsufficientGasReserve) {
        return (
          <ClickAwayListener
            onClickAway={() => setShowInsufficientTooltip(undefined)}
          >
            <Tooltip
              open={showInsufficientTooltip === percent}
              onClose={() => setShowInsufficientTooltip(undefined)}
              title={INSUFFICIENT_FUNDS_MESSAGE}
              arrow
              disableFocusListener
              disableHoverListener
              disableTouchListener
            >
              {button}
            </Tooltip>
          </ClickAwayListener>
        );
      }

      if (percent === 100) {
        return (
          <Tooltip title={GAS_RESERVE_INFO_MESSAGE} arrow>
            {button}
          </Tooltip>
        );
      }

      return button;
    },
    [isGasToken, hasInsufficientGasReserve, showInsufficientTooltip],
  );

  const renderPercentButton = useCallback(
    (percent: number) => {
      const button = (
        <Button
          sx={{
            ...styles.percentButton,
            ...(props.selectedPercent === percent
              ? styles.percentButtonSelected
              : {}),
          }}
          disabled={props.isTransactionInProgress}
          onClick={(e) => handlePercentClick(e, percent)}
        >
          <Typography fontSize={12} fontWeight={600} textTransform="none">
            {percent === 100 ? 'Max' : `${percent}%`}
          </Typography>
        </Button>
      );

      return renderPercentButtonWithTooltip(button, percent);
    },
    [styles, props, handlePercentClick, renderPercentButtonWithTooltip],
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
