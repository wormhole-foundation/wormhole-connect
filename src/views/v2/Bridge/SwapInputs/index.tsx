import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { RootState } from 'store';
import { setAmount, swapInputs } from 'store/transferInput';
import { swapWallets } from 'store/wallet';

function SwapInputs() {
  const dispatch = useDispatch();
  const theme: any = useTheme();

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const styles = useMemo(
    () => ({
      swapButton: {
        display: 'flex',
        position: 'absolute',
        backgroundColor: theme.palette.input.background,
        border: `4px solid ${theme.palette.background.form}`,
        borderRadius: '8px',
        bottom: -20,
        left: 'calc(50% - 18px)',
        width: 36,
        height: 36,
        zIndex: 1,
        '&:disabled, &:hover': {
          backgroundColor: theme.palette.input.background,
        },
      },
    }),
    [],
  );

  const canSwap = !isTransactionInProgress && fromChain && toChain;

  const swap = useCallback(() => {
    if (!canSwap || isTransactionInProgress) return;

    dispatch(swapInputs());
    dispatch(swapWallets());
    dispatch(setAmount(''));
  }, [canSwap, isTransactionInProgress, dispatch]);

  return (
    <IconButton sx={styles.swapButton} onClick={swap} disabled={!canSwap}>
      <ArrowDownwardIcon
        sx={{
          borderRadius: '8px',
          fontSize: '14px',
          stroke: canSwap
            ? theme.palette.text.primary
            : theme.palette.text.disabled,
          strokeWidth: 2,
        }}
      />
    </IconButton>
  );
}

export default SwapInputs;
