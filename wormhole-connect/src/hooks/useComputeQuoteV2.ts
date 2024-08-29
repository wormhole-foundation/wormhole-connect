import { useEffect, useState } from 'react';

import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';

import config from 'config';

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
  relayerFeeTokenKey: string;
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
  const [relayerFeeTokenKey, setRelayerFeeTokenKey] = useState('');

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
      setRelayerFeeTokenKey('');
      return;
    }

    let cancelled = false;

    const computeQuote = async () => {
      try {
        setIsFetching(true);

        const r = config.routes.get(route);

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
            setEta(0);
            setReceiveAmountError(quote.error.message);
            setReceiveNativeAmt(0);
            setRelayerFee(0);
            setRelayerFeeTokenKey('');
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

            const feeToken = config.sdkConverter.findTokenConfigV1(
              token,
              Object.values(config.tokens),
            );
            if (!feeToken) {
              console.error('Could not find relayer fee token', token);
            }

            setRelayerFee(sdkAmount.whole(amount));
            setRelayerFeeTokenKey(feeToken?.key || '');
          } else {
            setRelayerFee(0);
            setRelayerFeeTokenKey('');
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
          setRelayerFeeTokenKey('');
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
    relayerFeeTokenKey,
  };
};

export default useComputeQuoteV2;
