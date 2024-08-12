import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Chain, finality } from '@wormhole-foundation/sdk-base';

import config from 'config';
import RouteOperator from 'routes/operator';

import type { Route } from 'config/types';
import type { RootState } from 'store';
import { calculateUSDPrice } from 'utils';
import { toFixedDecimals } from 'utils/balance';
import { millisToMinutesAndSeconds } from 'utils/transferValidation';

type Props = {
  sourceChain: Chain | undefined;
  sourceToken: string;
  destChain: Chain | undefined;
  destToken: string;
  route: Route | undefined;
  amount: string;
  toNativeToken: number;
};

type returnProps = {
  receiveAmount: number | undefined;
  receiveAmountUSD: string | undefined;
  estimatedTime: string | undefined;
  isFetching: boolean;
};

const useComputeFees = (props: Props): returnProps => {
  const {
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route,
    toNativeToken,
  } = props;

  const {
    usdPrices: { data: tokenPrices },
  } = useSelector((state: RootState) => state.tokenPrices);

  const [receiveAmount, setReceiveAmount] = useState<number | undefined>(
    undefined,
  );
  const [receiveAmountUSD, setReceiveAmountUSD] = useState<string | undefined>(
    undefined,
  );
  const [estimatedTime, setEstimatedTime] = useState<string | undefined>(
    undefined,
  );

  const [isFetching, setIsFetching] = useState(false);

  const getEstimatedTime = useCallback((chain?: Chain) => {
    if (!chain) {
      return undefined;
    }

    const chainFinality = finality.finalityThreshold.get(chain);

    if (typeof chainFinality === 'undefined') {
      return undefined;
    }

    const blockTime = finality.blockTime.get(chain);

    if (typeof blockTime === 'undefined') {
      return undefined;
    }

    return chainFinality === 0
      ? 'Instantly'
      : millisToMinutesAndSeconds(blockTime * chainFinality);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function computeFees() {
      try {
        if (!route) {
          return;
        }

        setIsFetching(true);

        const routeOptions = { nativeGas: toNativeToken };

        const receiveAmount = await RouteOperator.computeReceiveAmountWithFees(
          route,
          Number.parseFloat(amount),
          sourceToken,
          destToken,
          sourceChain,
          destChain,
          routeOptions,
        );

        setIsFetching(false);

        if (!cancelled) {
          setReceiveAmount(
            Number.parseFloat(toFixedDecimals(`${receiveAmount}`, 6)),
          );
          setReceiveAmountUSD(
            calculateUSDPrice(
              receiveAmount,
              tokenPrices || {},
              config.tokens[destToken],
            ),
          );
          setEstimatedTime(getEstimatedTime(sourceChain));
        }
      } catch (e) {
        console.error(e);

        if (!cancelled) {
          setReceiveAmount(0);
          setReceiveAmountUSD('');
          setEstimatedTime(getEstimatedTime(sourceChain));
        }
      } finally {
        setIsFetching(false);
      }
    }

    computeFees();

    return () => {
      cancelled = true;
    };
  }, [
    route,
    amount,
    toNativeToken,
    sourceToken,
    destToken,
    sourceChain,
    destChain,
    tokenPrices,
  ]);

  return {
    receiveAmount,
    receiveAmountUSD,
    estimatedTime,
    isFetching,
  };
};

export default useComputeFees;
