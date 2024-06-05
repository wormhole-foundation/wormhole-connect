import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { isPorticoRoute } from 'routes/porticoBridge/utils';
import RouteOperator from 'routes/operator';

import {
  setReceiveAmount,
  setFetchingReceiveAmount,
  setReceiveAmountError,
} from 'store/transferInput';

import type { Route } from 'config/types';
import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import type { PorticoBridgeState } from 'store/porticoBridge';

type Props = {
  sourceChain: ChainName | undefined;
  sourceToken: string;
  destChain: ChainName | undefined;
  destToken: string;
  route: Route | undefined;
  amount: string;
  portico: PorticoBridgeState;
  toNativeToken: number;
  relayerFee: number | undefined;
};

export const useComputeReceiveAmount = (props: Props): void => {
  const {
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    portico,
    route,
    toNativeToken,
    relayerFee,
  } = props;

  const dispatch = useDispatch();

  useEffect(() => {
    if (
      !route ||
      !amount ||
      !sourceToken ||
      !destToken ||
      !sourceChain ||
      !destChain
    ) {
      return;
    }

    const recomputeReceive = async () => {
      try {
        const routeOptions = isPorticoRoute(route)
          ? portico
          : { toNativeToken, relayerFee };

        dispatch(setFetchingReceiveAmount());

        const newReceiveAmount = await RouteOperator.computeReceiveAmount(
          route,
          Number.parseFloat(amount),
          sourceToken,
          destToken,
          sourceChain,
          destChain,
          routeOptions,
        );
        dispatch(setReceiveAmount(newReceiveAmount.toString()));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        dispatch(setReceiveAmountError(e.message));
      }
    };
    recomputeReceive();
  }, [
    amount,
    toNativeToken,
    relayerFee,
    route,
    sourceToken,
    destToken,
    destChain,
    sourceChain,
    portico,
    dispatch,
  ]);
};
