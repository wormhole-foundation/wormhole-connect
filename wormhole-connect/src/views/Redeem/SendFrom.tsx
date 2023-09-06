import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import InputContainer from 'components/InputContainer';
import { RenderRows } from 'components/RenderRows';
import { RootState } from 'store';
import { TransferDisplayData } from 'utils/routes';
import RouteOperator from 'utils/routes/operator';

import Confirmations from './Confirmations';
import Header from './Header';

function SendFrom() {
  const { txData, route, signedMessage } = useSelector(
    (state: RootState) => state.redeem,
  );
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );

  const [rows, setRows] = useState([] as TransferDisplayData);

  useEffect(() => {
    if (!txData || !route) return;
    RouteOperator.getTransferSourceInfo(route, { txData }).then((rows) =>
      setRows(rows),
    );
  }, [txData, route]);

  return (
    <div>
      <InputContainer>
        <Header
          chain={txData!.fromChain}
          address={txData!.sender}
          txHash={txData!.sendTx}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {!transferComplete && !signedMessage && (
        <Confirmations chain={txData!.fromChain} blockHeight={txData!.block} />
      )}
    </div>
  );
}

export default SendFrom;
