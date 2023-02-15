import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { utils } from 'ethers';
import { RootState } from '../../store';
import { ParsedVaa } from '../../utils/vaa';

import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows, RowsData } from '../../components/RenderRows';
import { CHAINS } from '../../sdk/config';
import { PaymentOption } from '../../store/transfer';
// import Confirmations from './Confirmations';

const getRows = (txData: any): RowsData => {
  const decimals = txData.tokenDecimals > 8 ? 8 : txData.tokenDecimals;
  const formattedAmt = utils.formatUnits(txData.amount, decimals);
  const type = txData.payloadID;

  // manual transfers
  if (type === PaymentOption.MANUAL) {
    const sendingGasToken = CHAINS[txData.fromChain];
    return [
      {
        title: 'Amount',
        value: `${formattedAmt} ${txData.tokenSymbol}`,
      },
      {
        title: 'Gas fee',
        value: `TODO ${sendingGasToken.symbol}`,
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
      value: `≈ ${formattedToNative} ${txData.tokenSymbol} \u27F6 ${gasToken}`,
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
          txHash={vaa?.txHash}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {/* {pending && <Confirmations confirmations={vaa.guardianSignatures} />} */}
    </div>
  );
}

export default SendFrom;
