import { useEffect, useState } from 'react';
import config from 'config';
import { getTokenDetails } from 'telemetry';
import { maybeLogSdkError } from 'utils/errors';
import { ReadOnlyWallet } from 'utils/wallet/ReadOnlyWallet';
import type { Chain } from '@wormhole-foundation/sdk';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';

type HookReturn = {
  supportedRoutes: string[];
  isFetching: boolean;
};

interface UseFetchSupportedRoutesArgs {
  fromChain: Chain | undefined;
  toChain: Chain | undefined;
  sourceToken: Token | undefined;
  destToken: Token | undefined;
  toNativeToken: number;
  receivingWallet: WalletData | undefined;
}

const useFetchSupportedRoutes = ({
  fromChain,
  toChain,
  sourceToken,
  destToken,
  toNativeToken,
  receivingWallet,
}: UseFetchSupportedRoutesArgs): HookReturn => {
  const [routes, setRoutes] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

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
          receivingWallet?.name === ReadOnlyWallet.NAME
        ) {
          return;
        }

        let supported = false;

        try {
          supported = await route.isRouteSupported(
            name,
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

        // HAX - Enable Mayan routes (except SHUTTLE) for all assets
        // TODO token refactor
        if (
          route.rc.name.includes('Mayan') &&
          route.rc.name !== 'MayanRouteSHUTTLE'
        ) {
          supported = true;
        }

        if (supported) {
          _routes.push(name);
        }
      });

      // HAX - We don't want users to use the token bridge route when the TBTC route is available
      // or they might receive frankenstein TBTC
      if (_routes.includes('ManualTBTC')) {
        _routes = _routes.filter(
          (route) =>
            ![
              'ManualTokenBridge',
              'AutomaticTokenBridge',
              'TokenBridgeExecutorRoute',
            ].includes(route),
        );
      }

      if (isActive) {
        setIsFetching(false);
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
    fromChain,
    toChain,
    toNativeToken,
    receivingWallet,
  ]);

  return {
    supportedRoutes: routes,
    isFetching,
  };
};

export default useFetchSupportedRoutes;
