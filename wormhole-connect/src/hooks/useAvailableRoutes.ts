import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';

import { RouteState, setRoutes } from 'store/transferInput';
import RouteOperator from 'routes/operator';
import config from 'config';

import type { ChainName } from 'sdklegacy';
import type { Route } from 'config/types';
import type { RootState } from 'store';

type Props = {
  sourceChain: ChainName | undefined;
  sourceToken: string;
  destChain: ChainName | undefined;
  destToken: string;
  amount: string;
};

const useAvailableRoutes = (props: Props): void => {
  const dispatch = useDispatch();

  const { sourceChain, sourceToken, destChain, destToken, amount } = props;

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const [debouncedAmount] = useDebounce(amount, 500);

  useEffect(() => {
    if (!sourceChain || !destChain || !sourceToken || !destToken) {
      return;
    }

    let isActive = true;

    const getAvailable = async () => {
      const routes: RouteState[] = [];
      for (const value of config.routes) {
        const r = value as Route;

        let supported = false;
        let available = false;

        try {
          supported = await RouteOperator.isRouteSupported(
            r,
            sourceToken,
            destToken,
            debouncedAmount,
            sourceChain,
            destChain,
          );
        } catch (e) {
          console.error('Error when checking route is supported:', e, r);
        }

        // Check availability of a route only when it is supported
        // Primary goal here is to prevent any unnecessary RPC calls
        if (supported) {
          try {
            available = await RouteOperator.isRouteAvailable(
              r,
              sourceToken,
              destToken,
              debouncedAmount,
              sourceChain,
              destChain,
              { nativeGas: toNativeToken },
            );
          } catch (e) {
            console.error('Error when checking route is available:', e, r);
          }
        }

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
    sourceToken,
    destToken,
    debouncedAmount,
    sourceChain,
    destChain,
    toNativeToken,
  ]);
};

export default useAvailableRoutes;
