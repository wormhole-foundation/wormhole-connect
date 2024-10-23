import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { setReceiveAmount, setReceiveAmountError } from 'store/transferInput';

import { setReceiveNativeAmt, setRelayerFee } from 'store/relay';
import { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';
import { toDecimals } from 'utils/balance';
import config from 'config';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  destToken: string;
  route?: string;
  amount: sdkAmount.Amount;
  toNativeToken: number;
};

type returnProps = {
  isFetching: boolean;
};

const useComputeQuote = (props: Props): returnProps => {
  const {
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route,
    toNativeToken,
  } = props;

  const dispatch = useDispatch();

  const [isFetching, setIsFetching] = useState(false);

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
        setIsFetching(true);

        const quote = (
          await config.routes.getQuotes([route], {
            amount,
            sourceToken,
            destToken,
            sourceChain,
            destChain,
            nativeGas: toNativeToken,
          })
        )[0];

        if (!quote.success) {
          if (isActive) {
            dispatch(setReceiveAmountError(quote.error.message));
            dispatch(setReceiveNativeAmt(0));
            dispatch(setRelayerFee(undefined));
          }
          setIsFetching(false);
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
            const feeToken = config.sdkConverter.findTokenConfigV1(
              token,
              Object.values(config.tokens),
            );
            if (!feeToken) {
              console.error('Could not find relayer fee token', token);
            }
            const formattedFee = Number.parseFloat(
              toDecimals(amount.amount, amount.decimals, 6),
            );
            dispatch(
              setRelayerFee({
                fee: formattedFee,
                tokenKey: feeToken?.key || '',
              }),
            );
          } else {
            dispatch(setRelayerFee(undefined));
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (isActive) {
          dispatch(setReceiveAmountError(e.message));
          dispatch(setReceiveNativeAmt(0));
          dispatch(setRelayerFee(undefined));
        }
      } finally {
        setIsFetching(false);
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
    dispatch,
  ]);

  return {
    isFetching,
  };
};

export default useComputeQuote;
