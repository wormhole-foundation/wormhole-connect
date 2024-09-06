import React, { useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTxDetails,
  setSendTx,
  setRoute as setRedeemRoute,
  setTimestamp,
} from 'store/redeem';

export default () => {
  const dispatch = useDispatch();

  const mockRedeem = () => {
    dispatch(
      setTxDetails({
        sendTx: txId,
        sender: sendingWallet.address,
        amount,
        recipient: receivingWallet.address,
        toChain: receipt.to,
        fromChain: receipt.from,
        tokenAddress: getWrappedToken(sourceTokenConfig).tokenId!.address,
        tokenKey: sourceTokenConfig.key,
        tokenDecimals: getTokenDecimals(
          sourceChain,
          getWrappedTokenId(sourceTokenConfig),
        ),
        receivedTokenKey: config.tokens[destToken].key, // TODO: possibly wrong (e..g if portico swap fails)
        relayerFee,
        receiveAmount: receiveAmount.data || '',
        receiveNativeAmount: receiveNativeAmt,
        eta,
      }),
    );
  };

  return <button onClick={mockRedeem}>Mock Redeem view</button>;
};
