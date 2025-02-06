import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { RootState } from 'store';
import { setAmount, swapInputs } from 'store/transferInput';
import { swapWallets } from 'store/wallet';

const useStyles = makeStyles()(() => ({
  swapButton: {
    display: 'block',
    position: 'absolute',
    bottom: -44,
    left: 'calc(50% - 20px)',
    width: 40,
    height: 40,
    zIndex: 1,
  },
}));

function SwapInputs() {
  const dispatch = useDispatch();
  const [rotateAnimation, setRotateAnimation] = useState('');

  const { isTransactionInProgress, fromChain, toChain, toNonSDKChain } =
    useSelector((state: RootState) => state.transferInput);

  const canSwap =
    fromChain &&
    !config.chains[fromChain]?.disabledAsDestination &&
    toChain &&
    !config.chains[toChain]?.disabledAsSource &&
    toNonSDKChain !== 'Hyperliquid';

  const swap = useCallback(() => {
    if (!canSwap || isTransactionInProgress) return;

    setRotateAnimation((val) =>
      val === 'spinRight' ? 'spinLeft' : 'spinRight',
    );

    dispatch(swapInputs());
    dispatch(swapWallets());
    dispatch(setAmount(''));
  }, [canSwap, isTransactionInProgress, dispatch]);

  const { classes } = useStyles();

  return (
    <IconButton
      className={classes.swapButton}
      sx={{
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
