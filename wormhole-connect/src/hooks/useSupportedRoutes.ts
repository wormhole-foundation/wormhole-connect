import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';

import { RouteState, setRoutes } from 'store/transferInput';

import type { RootState } from 'store';
import config from 'config';
import { getTokenDetails } from 'telemetry';

const useAvailableRoutes = (): void => {
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

    const getSupportedRoutes = async () => {
      let routes: RouteState[] = [];
      await config.routes.forEach(async (name, route) => {
        let supported = false;

        try {
          supported = await route.isRouteSupported(
            token,
            destToken,
            debouncedAmount,
            fromChain,
            toChain,
          );
          if (supported && config.isRouteSupportedHandler) {
            supported = await config.isRouteSupportedHandler({
              route: name,
              fromChain,
              toChain,
              fromToken: getTokenDetails(token),
              toToken: getTokenDetails(destToken),
            });
          }
        } catch (e) {
          console.error('Error when checking route is supported:', e, name);
        }

        routes.push({ name, supported });
      });

      // If automatic NTT is available, always prefer that
      const autoNttRoute = routes.find(
        (route) => route.supported && route.name === 'AutomaticNtt',
      );
      if (autoNttRoute) {
        routes = [autoNttRoute];
      } else {
        // TODO figure out better approach to sorting routes... probably by ETA
        routes = routes.sort((a, b) => {
          const idxA = config.routes.preference.indexOf(a.name);
          const idxB = config.routes.preference.indexOf(b.name);
          return idxA - idxB;
        });
      }

      if (isActive) {
        dispatch(setRoutes(routes));
      }
    };

    getSupportedRoutes();

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
