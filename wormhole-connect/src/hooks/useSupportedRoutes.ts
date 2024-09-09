import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDebounce } from 'use-debounce';
import { calculateUSDPriceRaw } from 'utils';

import { RouteState, setRoutes } from 'store/transferInput';

import type { RootState } from 'store';
import config from 'config';
import { getTokenDetails } from 'telemetry';

const useAvailableRoutes = (): void => {
  const dispatch = useDispatch();

  const { usdPrices } = useSelector((state: RootState) => state.tokenPrices);

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

    const tokenConfig = config.tokens[token];
    const usdAmount = calculateUSDPriceRaw(
      debouncedAmount,
      usdPrices.data,
      tokenConfig,
    );

    const getSupportedRoutes = async () => {
      let routes: RouteState[] = [];
      await config.routes.forEach(async (name, route) => {
        if (
          usdAmount !== undefined &&
          usdAmount > 1000 &&
          name === 'MayanSwap'
        ) {
          return false;
        }

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
