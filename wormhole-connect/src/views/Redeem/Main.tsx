import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Redeem from './Redeem';
import TxSearch from './TxSearch';

function RedeemMain() {
  const txData = useSelector((state: RootState) => state.redeem.txData)!;

  return txData ? <Redeem /> : <TxSearch />;
}

export default RedeemMain;
