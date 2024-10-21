import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { QuoteResult } from 'routes/operator';
import { RootState } from 'store';
import { RouteState } from 'store/transferInput';
import { isMinAmountError } from 'utils/sdkv2';

type HookReturn = {
  error?: string;
  warning?: string;
};

type Props = {
  balance?: sdkAmount.Amount | null;
  routes: RouteState[];
  quotesMap: Record<string, QuoteResult | undefined>;
  tokenSymbol: string;
  isLoading: boolean;
  disabled?: boolean;
};

export const useAmountValidation = (props: Props): HookReturn => {
  const { amount } = useSelector((state: RootState) => state.transferInput);

  // Min amount available
  const minAmount = useMemo(
    () =>
      Object.values(props.quotesMap).reduce((minAmount, quoteResult) => {
        if (quoteResult?.success) {
          return minAmount;
        }

        if (!isMinAmountError(quoteResult?.error)) {
          return minAmount;
        }

        if (!minAmount) {
          return quoteResult.error.min;
        }

        const minAmountNum = BigInt(quoteResult.error.min.amount);
        const existingMin = BigInt(minAmount.amount);
        if (minAmountNum < existingMin) {
          return quoteResult.error.min;
        } else {
          return minAmount;
        }
      }, undefined as sdkAmount.Amount | undefined),
    [props.quotesMap],
  );

  const allRoutesFailed = useMemo(() => {
    if (Object.keys(props.quotesMap).length === 0) {
      return false;
    }

    return props.routes.every((route) => {
      return (
        props.quotesMap[route.name] !== undefined &&
        props.quotesMap[route.name]!.success === false
      );
    });
  }, [props.routes, props.quotesMap]);

  // Don't show errors when no amount is set or it's loading
  if (!amount || props.disabled) {
    return {};
  }

  // Balance errors
  if (props.balance) {
    if (sdkAmount.units(amount) > sdkAmount.units(props.balance)) {
      return {
        error: 'Amount exceeds available balance.',
      };
    }
  }

  if (allRoutesFailed) {
    if (minAmount) {
      const formattedAmount = sdkAmount.display(minAmount);
      return {
        error: `Amount too small (min ~${formattedAmount} ${props.tokenSymbol})`,
      };
    } else {
      return {
        error: 'No routes found for this transaction.',
      };
    }
  }

  // MinQuote warnings information
  if (minAmount) {
    const formattedAmount = sdkAmount.display(minAmount);
    return {
      warning: `More routes available for amounts exceeding ${formattedAmount} ${props.tokenSymbol}`,
    };
  }

  return {};
};
