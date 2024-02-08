import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import InputContainer from 'components/InputContainer';
import { RenderRows } from 'components/RenderRows';
import { RootState } from 'store';
import { TransferDisplayData } from 'routes';
import RouteOperator from 'routes/operator';

import Confirmations from './Confirmations';
import Header from './Header';

function SendFrom() {
  const { txData, route, signedMessage } = useSelector(
    (state: RootState) => state.redeem,
  );
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const [rows, setRows] = useState([] as TransferDisplayData);

  useEffect(() => {
    if (!txData || !route) return;

    RouteOperator.getTransferSourceInfo(route, {
      txData,
      tokenPrices: prices,
    }).then((rows) => setRows(rows));
  }, [txData, route, data]);

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
