import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Color from 'color';

import config from 'config';
import SwapVerticalIcon from 'icons/SwapVertical';
import type { RootState } from 'store';
import { setAmount, swapInputs } from 'store/transferInput';
import { setToNativeToken } from 'store/relay';
import {
  handleTelemetryOnChainSelect,
  handleTelemetryOnTokenSelect,
} from 'telemetry/utils';

function SwapInputs() {
  const dispatch = useDispatch();
  const theme: any = useTheme();
  const [rotateAnimation, setRotateAnimation] = useState('');

  const { isTransactionInProgress, fromChain, toChain, token, destToken } =
    useSelector((state: RootState) => state.transferInput);

  const styles = useMemo(
    () => ({
      swapButton: {
        display: 'flex',
        position: 'absolute',
        backgroundColor: theme.palette.input.background,
        border: `2px solid ${theme.palette.input.border}`,
        borderRadius: '36px',
        left: 'calc(50% - 18px)',
        top: 'calc(50% - 18px)',
        width: 36,
        height: 36,
        zIndex: 1,
        transition: 'background-color 0.2s ease-in-out',
        animation: `${rotateAnimation} 0.3s linear 1`,
        '@keyframes spinRight': {
          '0%': {
            transform: 'rotate(-180deg)',
          },
          '100%': {
            transform: 'rotate(0deg)',
          },
        },
        '@keyframes spinLeft': {
          '0%': {
            transform: 'rotate(180deg)',
          },
          '100%': {
            transform: 'rotate(0deg)',
          },
        },
        '&:disabled': {
          backgroundColor: theme.palette.input.background,
        },
        '&:hover:not(:disabled)': {
          backgroundColor:
            theme.palette.mode === 'dark'
              ? Color(theme.palette.input.background).lighten(0.1).hex()
              : Color(theme.palette.input.background).darken(0.1).hex(),
        },
      },
    }),
    [
      theme.palette.input.background,
      theme.palette.input.border,
      theme.palette.mode,
      rotateAnimation,
    ],
  );

  const canSwap = !isTransactionInProgress && fromChain && toChain;

  const swap = useCallback(() => {
    if (!canSwap || isTransactionInProgress) return;

    setRotateAnimation((val) =>
      val === 'spinRight' ? 'spinLeft' : 'spinRight',
    );
    dispatch(setToNativeToken(0));

    dispatch(swapInputs());
    dispatch(setAmount(''));

    // Emit select.* events to notify about the swap action
    handleTelemetryOnChainSelect(fromChain, false);
    handleTelemetryOnChainSelect(toChain, true);

    // There is a possibility that swap action happens before user selects tokens
    if (token) {
      const fromToken = config.tokens.get(token);
      if (fromToken) {
        handleTelemetryOnTokenSelect(fromToken, false);
      }
    }
    if (destToken) {
      const toToken = config.tokens.get(destToken);
      if (toToken) {
        handleTelemetryOnTokenSelect(toToken, true);
      }
    }
  }, [
    canSwap,
    isTransactionInProgress,
    dispatch,
    toChain,
    fromChain,
    token,
    destToken,
  ]);

  return (
    <IconButton
      sx={styles.swapButton}
      disabled={!canSwap}
      disableRipple
      onClick={swap}
    >
      <SwapVerticalIcon
        sx={{
          width: '36px',
          height: '36px',
          color: canSwap
            ? theme.palette.text.primary
            : theme.palette.text.disabled,
        }}
      />
    </IconButton>
  );
}

export default React.memo(SwapInputs);
