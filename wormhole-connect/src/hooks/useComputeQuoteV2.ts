import { useEffect, useState } from 'react';

import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import config from 'config';
import { getRoute } from 'routes/mappings';
import { getTokenDecimals } from 'utils';
import { toChainId } from 'utils/sdk';
import { toDecimals } from 'utils/balance';

import type { Route } from 'config/types';
import type { ChainName } from 'sdklegacy';

type Props = {
  sourceChain: ChainName | undefined;
  sourceToken: string;
  destChain: ChainName | undefined;
  destToken: string;
  route: Route | undefined;
  amount: string;
  toNativeToken: number;
};

type returnProps = {
  receiveAmount: string;
  receiveAmountError: string;
  isFetching: boolean;
  receiveNativeAmt: number;
  relayerFee: number;
};

const useComputeQuoteV2 = (props: Props): returnProps => {
  const {
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route,
    toNativeToken,
  } = props;

  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveAmountError, setReceiveAmountError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [receiveNativeAmt, setReceiveNativeAmt] = useState(0);
  const [relayerFee, setRelayerFee] = useState(0);

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

    const parsedAmount = Number.parseFloat(amount);

    if (Number.isNaN(parsedAmount)) {
      setReceiveAmount('0');
      setReceiveNativeAmt(0);
      setRelayerFee(0);
      return;
    }

    let cancelled = false;

    const computeQuote = async () => {
      try {
        setIsFetching(true);

        const r = getRoute(route);

        const quote = await r.computeQuote(
          parsedAmount,
          sourceToken,
          destToken,
          sourceChain,
          destChain,
          { nativeGas: toNativeToken },
        );

        setIsFetching(false);

        if (!quote.success) {
          if (!cancelled) {
            setReceiveAmountError(quote.error.message);
            setReceiveNativeAmt(0);
            setRelayerFee(0);
          }

          return;
        }

        if (!cancelled) {
          setReceiveAmount(
            sdkAmount.whole(quote.destinationToken.amount).toString(),
          );

          if (quote.destinationNativeGas) {
            setReceiveNativeAmt(sdkAmount.whole(quote.destinationNativeGas));
          } else {
            setReceiveNativeAmt(0);
          }

          if (quote.relayFee) {
            const { token, amount } = quote.relayFee;
            const feeToken = config.sdkConverter.toTokenIdV1(token);
            const decimals = getTokenDecimals(toChainId(sourceChain), feeToken);

            setRelayerFee(
              Number.parseFloat(toDecimals(amount.amount, decimals, 6)),
            );
          } else {
            setRelayerFee(0);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setReceiveAmountError(e.message);
          setReceiveNativeAmt(0);
          setRelayerFee(0);
        }
      } finally {
        setIsFetching(false);
      }
    };

    computeQuote();

    return () => {
      cancelled = true;
    };
  }, [
    sourceChain,
    sourceToken,
    destChain,
    destToken,
    amount,
    route,
    toNativeToken,
  ]);

  return {
    receiveAmount,
    receiveAmountError,
    isFetching,
    receiveNativeAmt,
    relayerFee,
  };
};

export default useComputeQuoteV2;
