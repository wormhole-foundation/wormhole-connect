import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import InputContainer from '../../components/InputContainer';
import { RenderRows } from '../../components/RenderRows';
import { RootState } from '../../store';
import Operator, { TransferDisplayData } from '../../utils/routes';
import Confirmations from './Confirmations';
import Header from './Header';

function SendFrom() {
  const { messageInfo, route } = useSelector(
    (state: RootState) => state.redeem,
  );
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );

  const [rows, setRows] = useState([] as TransferDisplayData);

  useEffect(() => {
    if (!txData) return;
    new Operator()
      .getTransferSourceInfo(route, { txData })
      .then((rows) => setRows(rows));
  }, [txData, route]);

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
      {!transferComplete && !messageInfo && (
        <Confirmations chain={txData.fromChain} blockHeight={txData.block} />
      )}
    </div>
  );
}

export default SendFrom;
