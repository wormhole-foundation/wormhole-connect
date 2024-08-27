import { useEffect, useState } from 'react';

import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';

import config from 'config';
import { getTokenDecimals } from 'utils';
import { toDecimals } from 'utils/balance';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  destToken: string;
  route?: string;
  amount: string;
  toNativeToken: number;
};

type returnProps = {
  eta: number;
  isFetching: boolean;
  receiveAmount: string;
  receiveAmountError: string;
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

  const [eta, setEta] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveAmountError, setReceiveAmountError] = useState('');
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

    if (Number.isNaN(Number.parseFloat(amount))) {
      setReceiveAmount('0');
      setReceiveNativeAmt(0);
      setRelayerFee(0);
      return;
    }

    let cancelled = false;

    const computeQuote = async () => {
      try {
        setIsFetching(true);

        const r = config.routes.get(route);

        const quote = await r.computeQuote(
          amount,
          sourceToken,
          destToken,
          sourceChain,
          destChain,
          { nativeGas: toNativeToken },
        );

        setIsFetching(false);

        if (!quote.success) {
          if (!cancelled) {
            setEta(0);
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
            const decimals = getTokenDecimals(sourceChain, feeToken);

            setRelayerFee(
              Number.parseFloat(toDecimals(amount.amount, decimals, 6)),
            );
          } else {
            setRelayerFee(0);
          }

          if (quote.eta) {
            setEta(quote.eta);
          }
        }
      } catch (e: unknown) {
        if (!cancelled && e instanceof Error) {
          setEta(0);
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
    eta,
    isFetching,
    receiveAmount,
    receiveAmountError,
    receiveNativeAmt,
    relayerFee,
  };
};

export default useComputeQuoteV2;
