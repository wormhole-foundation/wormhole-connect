import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { CHAINS } from 'config';

import { swapWallets } from 'store/wallet';
import { swapChains } from 'store/transferInput';
import { RootState } from '../../store';

type StyleProps = { disabled: boolean };
const useStyles = makeStyles<StyleProps>()((theme: any, { disabled }) => ({
  button: {
    borderRadius: '50%',
    width: '42px',
    height: '42px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.card.background,
    boxShadow: theme.palette.card.elevation,
    opacity: disabled ? 0.5 : 1.0,
    cursor: disabled ? 'default' : 'pointer',
    [theme.breakpoints.up('md')]: {
      marginBottom: '-40px',
    },
    zIndex: 2,
  },
}));

function SwapChains() {
  const dispatch = useDispatch();

  const { isTransactionInProgress, fromChain, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const canSwap =
    fromChain &&
    !CHAINS[fromChain]?.disabledAsDestination &&
    toChain &&
    !CHAINS[toChain]?.disabledAsDestination;

  const swap = () => {
    if (!canSwap) return;
    if (isTransactionInProgress) return;
    dispatch(swapChains());
    dispatch(swapWallets());
  };

  const { classes } = useStyles({ disabled: !canSwap });

  return (
    <div className={classes.button} onClick={swap}>
      <svg
        width="21"
        height="22"
        viewBox="0 0 21 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.88281 18.4384L3.49031 14.0547"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.88281 3.5625L7.88281 18.4375"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.1153 3.5625L17.5078 7.94625"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.1172 18.4375L13.1172 3.5625"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default SwapChains;
