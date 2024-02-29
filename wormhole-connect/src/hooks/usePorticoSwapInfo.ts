import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RouteOperator from 'routes/operator';
import { PorticoBridge } from 'routes/porticoBridge';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { RootState } from 'store';
import {
  resetSwapAmounts,
  setFetchingSwapAmounts,
  setSwapAmounts,
  setSwapAmountsError,
} from 'store/porticoBridge';
import { sleep } from 'utils';

const FETCH_SWAP_INFO_INTERVAL = 60000;

export const usePorticoSwapInfo = (): void => {
  const dispatch = useDispatch();
  const {
    route,
    token,
    destToken,
    toChain,
    fromChain,
    amount,
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
    const computeSwapAmounts = async () => {
      const isSupported = await RouteOperator.isRouteSupported(
        route,
        token,
        destToken,
        amount,
        fromChain,
        toChain,
      );
      if (!isSupported) {
        dispatch(resetSwapAmounts());
        return;
      }
      dispatch(setFetchingSwapAmounts());
      while (!cancelled) {
        try {
          const porticoBridge = RouteOperator.getRoute(route) as PorticoBridge;
          const swapAmounts = await porticoBridge.computeSwapAmounts(
            Number.parseFloat(amount),
            token,
            destToken,
            fromChain,
            toChain,
          );
          if (!cancelled) {
            dispatch(setSwapAmounts(swapAmounts));
          }
        } catch {
          if (!cancelled) {
            dispatch(setSwapAmountsError('Error computing swap amounts'));
          }
        }
        await sleep(FETCH_SWAP_INFO_INTERVAL);
      }
    };
    computeSwapAmounts();
    return () => {
      cancelled = true;
    };
  }, [
    route,
    token,
    destToken,
    toChain,
    fromChain,
    amount,
    isTransactionInProgress,
    dispatch,
  ]);
};
