import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from 'store';
import config from 'config';
import { getTokenDetails } from 'telemetry';
import { useGetTokens } from './useGetTokens';
import { maybeLogSdkError } from 'utils/errors';
import { ReadOnlyWallet } from 'utils/wallet/ReadOnlyWallet';

type HookReturn = {
  supportedRoutes: string[];
  isFetching: boolean;
};

const useFetchSupportedRoutes = (): HookReturn => {
  const [routes, setRoutes] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const { fromChain, toChain, toNonSDKChain, amount } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { sourceToken, destToken } = useGetTokens();

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const receivingWallet = useSelector(
    (state: RootState) => state.wallet.receiving,
  );

  useEffect(() => {
    if (!fromChain || !toChain || !sourceToken || !destToken) {
      setRoutes([]);
      setIsFetching(false);
      return;
    }

    let isActive = true;

    const getSupportedRoutes = async () => {
      setIsFetching(true);
      let _routes: string[] = [];
      await config.routes.forEach(async (name, route) => {
        // Disable manual routes when the receiving wallet is a ReadOnlyWallet
        // because the receiving wallet can't sign/complete the transaction
        if (
          !route.AUTOMATIC_DEPOSIT &&
          receivingWallet.name === ReadOnlyWallet.NAME
        ) {
          return;
        }

        let supported = false;

        try {
          supported = await route.isRouteSupported(
            sourceToken,
            destToken,
            fromChain,
            toChain,
          );

          if (supported && config.isRouteSupportedHandler) {
            supported = await config.isRouteSupportedHandler({
              route: name,
              fromChain,
              toChain,
              fromToken: getTokenDetails(sourceToken),
              toToken: getTokenDetails(destToken),
            });
          }
        } catch (e) {
          maybeLogSdkError(
            e,
            `Error when checking route (${name}) is supported`,
          );
        }

        // HAX
        // TODO token refactor
        if (route.rc.name.includes('Mayan')) {
          supported = true;
        }

        if (supported) {
          _routes.push(name);
        }
      });

      if (isActive) {
        setIsFetching(false);
        // When Hyperliquid chain is selected as destination, show ONLY Hyperliquid route;
        // otherwise do NOT show Hyperliquid route
        if (toNonSDKChain === 'Hyperliquid') {
          _routes = _routes.filter((r) => r === 'HyperliquidRoute');
        } else {
          _routes = _routes.filter((r) => r !== 'HyperliquidRoute');
        }
        setRoutes(_routes);
      }
    };

    getSupportedRoutes();

    return () => {
      isActive = false;
    };
  }, [
    sourceToken,
    destToken,
    amount,
    fromChain,
    toChain,
    toNativeToken,
    receivingWallet,
    toNonSDKChain,
  ]);

  return {
    supportedRoutes: routes,
    isFetching,
  };
};

export default useFetchSupportedRoutes;
