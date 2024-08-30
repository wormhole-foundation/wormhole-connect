import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from 'store';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import useRoutesQuotesBulk from 'hooks/useRoutesQuotesBulk';
import config from 'config';
import { RouteState } from 'store/transferInput';

export const useSortedSupportedRoutes = (): RouteState[] => {
  const { amount, routeStates, fromChain, token, toChain, destToken } =
    useSelector((state: RootState) => state.transferInput);
  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const supportedRoutes = useMemo(
    () => (routeStates || []).filter((rs) => rs.supported),
    [routeStates],
  );

  const supportedRoutesNames = useMemo(
    () => supportedRoutes.map((r) => r.name),
    [supportedRoutes],
  );

  const { quotesMap } = useRoutesQuotesBulk(supportedRoutesNames, {
    amount,
    sourceChain: fromChain,
    sourceToken: token,
    destChain: toChain,
    destToken,
    nativeGas: toNativeToken,
  });

  return useMemo(
    () =>
      [...supportedRoutes].sort((routeA, routeB) => {
        const quoteA = quotesMap[routeA.name];
        const quoteB = quotesMap[routeB.name];
        const routeConfigA = config.routes.get(routeA.name);
        const routeConfigB = config.routes.get(routeB.name);

        // 1. Prioritize automatic routes
        if (routeConfigA.AUTOMATIC_DEPOSIT && !routeConfigB.AUTOMATIC_DEPOSIT) {
          return -1;
        } else if (
          !routeConfigA.AUTOMATIC_DEPOSIT &&
          routeConfigB.AUTOMATIC_DEPOSIT
        ) {
          return 1;
        }

        if (quoteA?.success && quoteB?.success) {
          // 2. Prioritize estimated time
          if (quoteA?.eta && quoteB?.eta) {
            if (quoteA.eta > quoteB.eta) {
              return 1;
            } else if (quoteA.eta < quoteB.eta) {
              return -1;
            }
          }

          // 3. Compare relay fees
          if (quoteA?.relayFee && quoteB?.relayFee) {
            const relayFeeA = sdkAmount.whole(quoteA.relayFee.amount);
            const relayFeeB = sdkAmount.whole(quoteB.relayFee.amount);
            if (relayFeeA > relayFeeB) {
              return 1;
            } else if (relayFeeA < relayFeeB) {
              return -1;
            }
          }
        }

        // 4. Prioritize routes with quotes
        if (quoteA?.success && !quoteB?.success) {
          return -1;
        } else if (!quoteA?.success && quoteB?.success) {
          return 1;
        }

        // Don't swap when routes match by all criteria or don't have quotas
        return 0;
      }),
    [supportedRoutes, quotesMap],
  );
};
