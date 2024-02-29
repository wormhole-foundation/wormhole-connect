import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RouteOperator from 'routes/operator';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { RootState } from 'store';
import {
  resetRelayerFee,
  setFetchingRelayerFee,
  setRelayerFee,
  setRelayerFeeError,
} from 'store/porticoBridge';
import { sleep } from 'utils';

const FETCH_FEE_INTERVAL = 60000;

export const usePorticoRelayerFee = (): void => {
  const dispatch = useDispatch();
  const {
    route,
    token,
    destToken,
    toChain,
    fromChain,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);
  useEffect(() => {
    if (
      !route ||
      !isPorticoRoute(route) ||
      !token ||
      !destToken ||
      !fromChain ||
      !toChain ||
      isTransactionInProgress
    ) {
      return;
    }
    let cancelled = false;
    const getRelayerFee = async () => {
      const isSupported = await RouteOperator.isRouteSupported(
        route,
        token,
        destToken,
        // amount is not needed to check if the portico route is supported,
        // so we pass 0
        // excluding it as a dependency avoids unnecessary re-renders
        // that would cause the fee to be fetched again
        '0',
        fromChain,
        toChain,
      );
      if (!isSupported) {
        dispatch(resetRelayerFee());
        return;
      }
      dispatch(setFetchingRelayerFee());
      while (!cancelled) {
        try {
          const fee = await RouteOperator.getRelayerFee(
            route,
            fromChain,
            toChain,
            token,
            destToken,
          );
          if (!cancelled) {
            dispatch(setRelayerFee(fee.toString()));
          }
        } catch {
          if (!cancelled) {
            dispatch(setRelayerFeeError('Error fetching relayer fee'));
          }
        }
        await sleep(FETCH_FEE_INTERVAL);
      }
    };
    getRelayerFee();
    return () => {
      cancelled = true;
    };
  }, [
    route,
    token,
    destToken,
    toChain,
    fromChain,
    isTransactionInProgress,
    dispatch,
  ]);
};
