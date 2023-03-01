import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { utils } from 'ethers';
import { RootState } from '../../store';
import { ParsedVaa } from '../../utils/vaa';
import { CHAINS, TOKENS } from '../../sdk/config';
import { PaymentOption } from '../../store/transfer';
import { toDecimals } from '../../utils/balance';

import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows, RowsData } from '../../components/RenderRows';
import Confirmations from './Confirmations';

const getRows = (txData: any): RowsData => {
  const decimals = txData.tokenDecimals > 8 ? 8 : txData.tokenDecimals;
  const formattedAmt = toDecimals(txData.amount, decimals, 6);
  const { gasToken: sourceGasTokenSymbol } = CHAINS[txData.fromChain];
  const sourceGasToken = TOKENS[sourceGasTokenSymbol];
  const formattedGas = txData.gasFee
    ? toDecimals(txData.gasFee, sourceGasToken.decimals, 6)
    : undefined;
  const type = txData.payloadID;

  // manual transfers
  if (type === PaymentOption.MANUAL) {
    const { gasToken } = CHAINS[txData.fromChain];
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${txData.tokenSymbol}`,
      },
      {
        title: 'Gas fee',
        value: formattedGas ? `${formattedGas} ${gasToken}` : 'TODO',
      },
    ];
  }

  // automatic transfers
  const formattedFee = utils.formatUnits(txData.relayerFee, decimals);
  const formattedToNative = utils.formatUnits(
    txData.toNativeTokenAmount,
    decimals,
  );
  const { gasToken } = CHAINS[txData.toChain]!;
  return [
    {
      title: 'Amount',
      value: `${formattedAmt} ${txData.tokenSymbol}`,
    },
    {
      title: 'Relayer fee',
      value: `${formattedFee} ${txData.tokenSymbol}`,
    },
    {
      title: 'Convert to native gas token',
      value: `≈ ${formattedToNative} ${txData.tokenSymbol} \u2192 ${gasToken}`,
    },
  ];
};

function SendFrom() {
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );

  const [rows, setRows] = useState([] as RowsData);

  useEffect(() => {
    if (!txData) return;
    const rows = getRows(txData);
    setRows(rows);
  }, []);

  return (
    <div>
      <InputContainer>
        <Header
          network={txData.fromChain}
          address={txData.sender}
          loading={transferComplete ? false : !vaa}
          txHash={txData.sendTx}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {!vaa && (
        <Confirmations chain={txData.fromChain} blockHeight={txData.block} />
      )}
    </div>
  );
}

export default SendFrom;
