import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';

import { RouteState, setRoutes } from 'store/transferInput';
import RouteOperator from 'routes/operator';
import config from 'config';

import type { Route } from 'config/types';
import type { RootState } from 'store';

const useAvailableRoutes = () => {
  const dispatch = useDispatch();

  const { token, destToken, fromChain, toChain, amount } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const [debouncedAmount] = useDebounce(amount, 500);

  useEffect(() => {
    if (!fromChain || !toChain || !token || !destToken) {
      return;
    }

    let isActive = true;

    const getAvailable = async () => {
      const routes: RouteState[] = [];
      for (const value of config.routes) {
        const r = value as Route;
        const available = await RouteOperator.isRouteAvailable(
          r,
          token,
          destToken,
          debouncedAmount,
          fromChain,
          toChain,
          { nativeGas: toNativeToken },
        );

        const supported = await RouteOperator.isRouteSupported(
          r,
          token,
          destToken,
          debouncedAmount,
          fromChain,
          toChain,
        );

        routes.push({ name: r, supported, available });
      }

      if (isActive) {
        dispatch(setRoutes(routes));
      }
    };

    getAvailable();

    return () => {
      isActive = false;
    };
  }, [
    dispatch,
    token,
    destToken,
    debouncedAmount,
    fromChain,
    toChain,
    toNativeToken,
  ]);
};

export default useAvailableRoutes;
