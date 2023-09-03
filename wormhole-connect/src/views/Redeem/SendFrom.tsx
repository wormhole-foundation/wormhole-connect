import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import InputContainer from '../../components/InputContainer';
import { RenderRows } from '../../components/RenderRows';
import { RootState } from '../../store';
import Operator, { TransferDisplayData } from '../../utils/routes';

import Confirmations from './Confirmations';
import Header from './Header';

function SendFrom() {
  const { txData, route } = useSelector((state: RootState) => state.redeem);
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
          network={txData!.fromChain}
          address={txData!.sender}
          txHash={txData!.sendTx}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {!transferComplete && !txData && (
        <Confirmations chain={txData!.fromChain} blockHeight={txData!.block} />
      )}
    </div>
  );
}

export default SendFrom;
