import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Color from 'color';

import SwapVerticalIcon from 'icons/SwapVertical';
import { RootState } from 'store';
import { setAmount, swapInputs } from 'store/transferInput';
import { swapWallets } from 'utils/wallet';
import config from 'config';

function SwapInputs() {
  const dispatch = useDispatch();
  const theme: any = useTheme();
  const [rotateAnimation, setRotateAnimation] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const styles = useMemo(
    () => ({
      swapButton: {
        display: 'flex',
        position: 'absolute',
        backgroundColor: theme.palette.input.background,
        border: `2px solid ${theme.palette.background.form}`,
        borderRadius: '8px',
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
      theme.palette.background.form,
      theme.palette.input.background,
      theme.palette.mode,
      rotateAnimation,
    ],
  );

  const canSwap =
    !isTransactionInProgress &&
    !isSwapping &&
    fromChain &&
    toChain &&
    (!config.externalWalletManager || config.externalWalletManager.swapWallets);

  const swap = useCallback(async () => {
    if (!canSwap || isTransactionInProgress || isSwapping) return;

    setIsSwapping(true);
    setRotateAnimation((val) =>
      val === 'spinRight' ? 'spinLeft' : 'spinRight',
    );

    try {
      dispatch(swapInputs());
      await swapWallets(dispatch);
      dispatch(setAmount(''));
    } catch (error) {
      console.error('Failed to swap wallets:', error);
    } finally {
      setIsSwapping(false);
    }
  }, [canSwap, isTransactionInProgress, isSwapping, dispatch]);

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
