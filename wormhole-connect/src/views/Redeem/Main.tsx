import React from 'react';
import { RootState } from '../../store';
import Redeem from './Redeem';
import TxSearch from './TxSearch';
import { useSelector } from 'react-redux';

function RedeemMain() {
  const txData = useSelector((state: RootState) => state.redeem.txData)!;

  return txData ? <Redeem /> : <TxSearch />;
}

export default RedeemMain;
