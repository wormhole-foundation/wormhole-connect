import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import InputContainer from 'components/InputContainer';
import { RenderRows } from 'components/RenderRows';
import { RootState } from 'store';
import { TransferDisplayData } from 'routes';
import RouteOperator from 'routes/operator';

import Header from './Header';
import Confirmations from './Confirmations';
import { RouteContext } from 'contexts/RouteContext';
import { TransferState } from '@wormhole-foundation/sdk';

function SendFrom() {
  const { txData, route } = useSelector((state: RootState) => state.redeem);
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const [rows, setRows] = useState([] as TransferDisplayData);
  const routeContext = useContext(RouteContext);
  const isAttested =
    routeContext.receipt &&
    routeContext.receipt.state >= TransferState.Attested;

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
          side="source"
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {!isAttested && (
        <Confirmations chain={txData!.fromChain} blockHeight={0} />
      )}
    </div>
  );
}

export default SendFrom;
