import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../../store';
import { PaymentOption, setBalance, formatBalance } from '../../store/transfer';

import Header from '../../components/Header';
import Spacer from '../../components/Spacer';
import Networks from './Networks';
import GasOptions from './GasOptions';
import GasSlider from './NativeGasSlider';
import Preview from './Preview';
import Send from './Send';
import MenuFull from '../../components/MenuFull';
import { Collapse } from '@mui/material';
import { BigNumber } from 'ethers';
import { toDecimals } from '../../utils/balance';
import { useDispatch } from 'react-redux';
import { getNativeBalance } from '../../sdk/sdk';
import { CHAINS, TOKENS } from '../../sdk/config';

const useStyles = makeStyles()((theme) => ({
  bridgeContent: {
    margin: 'auto',
    maxWidth: '650px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
}));

function Bridge() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const { fromNetwork, toNetwork, amount, token, destGasPayment } = useSelector(
    (state: RootState) => state.transfer,
  );
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );

  useEffect(() => {
    if (!toNetwork || !receiving.address) return;
    const networkConfig = CHAINS[toNetwork]!;
    getNativeBalance(receiving.address, toNetwork).then((res: BigNumber) => {
      const tokenConfig = TOKENS[networkConfig.gasToken];
      if (!tokenConfig) throw new Error('Could not get native gas token config');
      dispatch(setBalance(formatBalance(tokenConfig, res)));
    });
  }, [toNetwork, receiving.address]);

  const valid =
    fromNetwork &&
    toNetwork &&
    amount &&
    token &&
    sending.address &&
    receiving.address;

  return (
    <div className={classes.bridgeContent}>
      <div className={classes.header}>
        <Header text="Bridge" align="left" />
        <MenuFull />
      </div>
      <Spacer height={40} />

      <Networks />
      <Spacer />

      <GasOptions disabled={!valid} />
      <Spacer />

      <Collapse in={destGasPayment === PaymentOption.AUTOMATIC}>
        <GasSlider disabled={!valid} />
        <Spacer />
      </Collapse>

      <Preview collapsed={!valid} />
      <Spacer />

      <Send valid={!!valid} />
      <Spacer height={60} />
    </div>
  );
}

export default Bridge;
