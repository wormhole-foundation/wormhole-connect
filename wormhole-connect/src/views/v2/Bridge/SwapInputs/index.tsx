import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
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
    bottom: '-24px',
    left: 'calc(50% - 20px)',
    width: 40,
    height: 40,
    zIndex: 1,
  },
}));

function SwapInputs() {
  const dispatch = useDispatch();
  const theme: any = useTheme();
  const [rotateAnimation, setRotateAnimation] = useState('');

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const canSwap =
    !isTransactionInProgress &&
    fromChain &&
    !config.chains[fromChain]?.disabledAsDestination &&
    toChain &&
    !config.chains[toChain]?.disabledAsSource;

  const swap = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();

      if (!canSwap || isTransactionInProgress) return;

      setRotateAnimation((val) =>
        val === 'spinRight' ? 'spinLeft' : 'spinRight',
      );

      dispatch(swapInputs());
      dispatch(swapWallets());
      dispatch(setAmount(''));
    },
    [canSwap, isTransactionInProgress, dispatch],
  );

  const { classes } = useStyles();

  return (
    <IconButton
      className={classes.swapButton}
      disableRipple={!canSwap}
      sx={{
        backgroundColor: theme.palette.background.form,
        '&:hover': {
          backgroundColor: theme.palette.background.form,
        },
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
    >
      <SwapVertIcon
        htmlColor={canSwap ? theme.palette.text : theme.palette.text.disabled}
      />
    </IconButton>
  );
}

export default SwapInputs;
