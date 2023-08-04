import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Route } from '../../store/transferInput';
import { CHAINS, TOKENS } from '../../config';
import {
  toNormalizedDecimals,
  MAX_DECIMALS,
  getTokenDecimals,
} from '../../utils';
import { toChainId } from '../../utils/sdk';
import { toDecimals } from '../../utils/balance';

import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows, RowsData } from '../../components/RenderRows';
import Confirmations from './Confirmations';

const getRows = (txData: any): RowsData => {
  const formattedAmt = toNormalizedDecimals(
    txData.amount,
    txData.tokenDecimals,
    MAX_DECIMALS,
  );
  const { gasToken: sourceGasTokenSymbol } = CHAINS[txData.fromChain]!;
  const sourceGasToken = TOKENS[sourceGasTokenSymbol];
  const decimals = getTokenDecimals(
    toChainId(sourceGasToken.nativeNetwork),
    sourceGasToken.tokenId,
  );
  const formattedGas =
    txData.gasFee && toDecimals(txData.gasFee, decimals, MAX_DECIMALS);
  const type = txData.payloadID;
  const token = TOKENS[txData.tokenKey];

  // manual transfers
  if (type === Route.BRIDGE) {
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${token.symbol}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas ? `${formattedGas} ${sourceGasTokenSymbol}` : '—',
      },
    ];
  }

  // automatic transfers
  const formattedFee = toNormalizedDecimals(
    txData.relayerFee,
    txData.tokenDecimals,
    MAX_DECIMALS,
  );
  const formattedToNative = toNormalizedDecimals(
    txData.toNativeTokenAmount,
    txData.tokenDecimals,
    MAX_DECIMALS,
  );
  const { gasToken } = CHAINS[txData.toChain]!;
  return [
    {
      title: 'Amount',
      value: `${formattedAmt} ${token.symbol}`,
    },
    {
      title: 'Gas fee',
      value: formattedGas ? `${formattedGas} ${sourceGasTokenSymbol}` : '—',
    },
    {
      title: 'Relayer fee',
      value: `${formattedFee} ${token.symbol}`,
    },
    {
      title: 'Convert to native gas token',
      value: `≈ ${formattedToNative} ${token.symbol} \u2192 ${gasToken}`,
    },
  ];
};

function SendFrom() {
  const readyForRedeem: boolean = useSelector(
    (state: RootState) => state.redeem.readyForRedeem,
  );
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );

  const [rows, setRows] = useState([] as RowsData);

  useEffect(() => {
    if (!txData) return;
    const rows = getRows(txData);
    setRows(rows);
  }, [txData]);

  return (
    <div>
      <InputContainer>
        <Header
          network={txData.fromChain}
          address={txData.sender}
          txHash={txData.sendTx}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {!transferComplete && !readyForRedeem && (
        <Confirmations chain={txData.fromChain} blockHeight={txData.block} />
      )}
    </div>
  );
}

export default SendFrom;
