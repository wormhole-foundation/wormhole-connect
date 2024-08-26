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

    const getAvailable = async () => {
      let routes: RouteState[] = [];
      await config.routes.forEach(async (name, route) => {
        let supported = false;
        let available = false;
        let availabilityError = '';

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

        // Check availability of a route only when it is supported
        // Primary goal here is to prevent any unnecessary RPC calls
        if (supported) {
          try {
            available = await route.isRouteAvailable(
              token,
              destToken,
              debouncedAmount,
              fromChain,
              toChain,
              { nativeGas: toNativeToken },
            );
          } catch (e) {
            availabilityError = 'Route is unavailable.';
            console.error('Error when checking route is available:', e, name);
          }
        }

        routes.push({ name, supported, available, availabilityError });
      });

      // If NTT or CCTP routes are available, then prioritize them over other routes
      const preferredRoutes = routes.filter(
        (route) =>
          route.supported &&
          ['ManualNtt', 'AutomaticNtt', 'ManualCCTP', 'AutomaticCCTP'].includes(
            route.name,
          ),
      );
      if (preferredRoutes.length > 0) {
        routes = preferredRoutes;
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
