import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import type { RootState } from 'store';
import useWalletProvider from 'hooks/useWalletProvider';
import { setAmount, swapInputs } from 'store/transferInput';

const styles = {
  swapButton: {
    display: 'block',
    position: 'absolute',
    bottom: -44,
    left: 'calc(50% - 20px)',
    width: 40,
    height: 40,
    zIndex: 1,
  },
} as const;

function SwapInputs() {
  const dispatch = useDispatch();
  const { swapWallets } = useWalletProvider();
  const [rotateAnimation, setRotateAnimation] = useState('');

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const canSwap = !isTransactionInProgress && fromChain && toChain;

  const swap = useCallback(() => {
    if (!canSwap || isTransactionInProgress) return;

    setRotateAnimation((val) =>
      val === 'spinRight' ? 'spinLeft' : 'spinRight',
    );

    swapWallets();

    dispatch(swapInputs());
    dispatch(setAmount(''));
  }, [canSwap, isTransactionInProgress, dispatch, swapWallets]);

  return (
    <IconButton
      sx={{
        ...styles.swapButton,
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
      }}
      onClick={swap}
      disabled={!canSwap}
    >
      <SwapVertIcon />
    </IconButton>
  );
}

export default SwapInputs;
