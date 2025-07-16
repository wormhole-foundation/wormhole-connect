import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import { RootState } from 'store';
import { setAmount, swapInputs } from 'store/transferInput';
import { swapWallets } from 'utils/wallet';
import config from 'config';

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
  const [rotateAnimation, setRotateAnimation] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
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
