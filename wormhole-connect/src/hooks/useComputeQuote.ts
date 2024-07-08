import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
  setReceiveAmount,
  setFetchingReceiveAmount,
  setReceiveAmountError,
} from 'store/transferInput';

import type { Route } from 'config/types';
import type { ChainName } from 'sdklegacy';
import type { PorticoBridgeState } from 'store/porticoBridge';
import { getRoute } from 'routes/mappings';
import { setReceiveNativeAmt, setRelayerFee } from 'store/relay';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { getTokenDecimals } from 'utils';
import config from 'config';
import { toChainId } from 'utils/sdk';
import { toDecimals } from 'utils/balance';

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

export const useComputeQuote = (props: Props): void => {
  const {
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    portico,
    route,
    toNativeToken,
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

    let isActive = true;
    const computeQuote = async () => {
      try {
        dispatch(setFetchingReceiveAmount());

        const parsedAmount = Number.parseFloat(amount);
        if (Number.isNaN(parsedAmount)) {
          dispatch(setReceiveAmount('0'));
          dispatch(setReceiveNativeAmt(0));
          dispatch(setRelayerFee(0));
          return;
        }

        const r = getRoute(route);
        const quote = await r.computeQuote(
          parsedAmount,
          sourceToken,
          destToken,
          sourceChain,
          destChain,
          { nativeGas: toNativeToken },
        );

        if (!quote.success) {
          if (isActive) {
            dispatch(setReceiveAmountError(quote.error.message));
            dispatch(setReceiveNativeAmt(0));
            dispatch(setRelayerFee(0));
          }
          return;
        }

        if (isActive) {
          dispatch(
            setReceiveAmount(
              sdkAmount.whole(quote.destinationToken.amount).toString(),
            ),
          );
          if (quote.destinationNativeGas) {
            dispatch(
              setReceiveNativeAmt(sdkAmount.whole(quote.destinationNativeGas)),
            );
          } else {
            dispatch(setReceiveNativeAmt(0));
          }
          if (quote.relayFee) {
            const { token, amount } = quote.relayFee;
            const feeToken = config.sdkConverter.toTokenIdV1(token);
            const decimals = getTokenDecimals(toChainId(sourceChain), feeToken);
            const formattedFee = Number.parseFloat(
              toDecimals(amount.amount, decimals, 6),
            );
            dispatch(setRelayerFee(formattedFee));
          } else {
            dispatch(setRelayerFee(0));
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (isActive) {
          dispatch(setReceiveAmountError(e.message));
          dispatch(setReceiveNativeAmt(0));
          dispatch(setRelayerFee(0));
        }
      }
    };

    computeQuote();

    return () => {
      isActive = false;
    };
  }, [
    amount,
    toNativeToken,
    route,
    sourceToken,
    destToken,
    destChain,
    sourceChain,
    portico,
    dispatch,
  ]);
};
