import { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import config, { getWormholeContextV2 } from 'config';
import { RouteContext } from 'contexts/RouteContext';
import {
  setRoute as setRedeemRoute,
  setIsResumeTx,
  setTimestamp,
  setTxDetails,
} from 'store/redeem';
import { setRoute as setAppRoute } from 'store/router';
import { setToChain } from 'store/transferInput';

import { TransactionLocal } from 'config/types';

const useResumeTransaction = (
  props: TransactionLocal | undefined,
): { isLoading: boolean; error?: string } => {
  const dispatch = useDispatch();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const routeContext = useContext(RouteContext);

  const { receipt, route, timestamp, txDetails, txHash } = props || {};

  useEffect(() => {
    let cancelled = false;

    if (!receipt || !route || !timestamp || !txDetails || !txHash) {
      return;
    }

    const resumeTx = async () => {
      setIsLoading(true);
      try {
        const wh = await getWormholeContextV2();
        const sdkRoute = new (config.routes.get(route).rc)(wh);

        if (!cancelled) {
          // Set the start time of the transaction
          dispatch(setTimestamp(timestamp));
          // Set transaction details required to display Redeem view
          dispatch(setTxDetails(txDetails));
          // Set to avoid send transfer.success event in Resume Transaction case
          dispatch(setIsResumeTx(true));
          // Set transaction route
          dispatch(setRedeemRoute(route));
          // Set transaction destination chain
          dispatch(setToChain(txDetails.toChain));
          // Set the App route to navigate user to Redeem view
          dispatch(setAppRoute('redeem'));

          routeContext.setRoute(sdkRoute);
          routeContext.setReceipt(receipt);
        }
      } catch (e: unknown) {
        setError(`Error resuming transaction: ${txHash}`);
      } finally {
        setIsLoading(false);
      }
    };

    resumeTx();

    return () => {
      cancelled = true;
    };
  }, [props]);

  return {
    isLoading,
    error,
  };
};

export default useResumeTransaction;
