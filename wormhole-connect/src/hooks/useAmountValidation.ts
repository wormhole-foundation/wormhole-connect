import { amount as sdkAmount, routes } from '@wormhole-foundation/sdk';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { QuoteResult } from 'routes/operator';
import { RootState } from 'store';
import { RouteState } from 'store/transferInput';

type HookReturn = {
  error?: string;
  warning?: string;
};

type Props = {
  balance?: string | null;
  routes: RouteState[];
  quotesMap: Record<string, QuoteResult | undefined>;
  tokenSymbol: string;
  isLoading: boolean;
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

        const minAmountError = quoteResult?.error as routes.MinAmountError;

        if (!minAmountError?.min) {
          return minAmount;
        }

        if (!minAmount) {
          return minAmountError.min;
        }

        const minAmountNum = parseFloat(minAmountError.min.amount);
        const existingMin = parseFloat(minAmount.amount);
        if (minAmountNum < existingMin) {
          return minAmountError.min;
        } else {
          return minAmount;
        }
      }, undefined as sdkAmount.Amount | undefined),
    [props.quotesMap],
  );

  const allRoutesFailed = useMemo(
    () => props.routes.every((route) => !props.quotesMap[route.name]?.success),
    [props.routes, props.quotesMap],
  );

  // Don't show errors when no amount is set or it's loading
  if (amount === '' || props.isLoading) {
    return {};
  }

  const numAmount = Number.parseFloat(amount);
  // Input errors
  if (Number.isNaN(numAmount)) {
    return {
      error: 'Amount must be a number.',
    };
  }
  if (numAmount <= 0) {
    return {
      error: 'Amount must be greater than 0.',
    };
  }

  // Balance errors
  if (props.balance) {
    const balanceNum = Number.parseFloat(props.balance.replace(',', ''));
    if (numAmount > balanceNum) {
      return {
        error: 'Amount exceeds available balance.',
      };
    }
  }

  // All quotes fail.
  if (allRoutesFailed) {
    if (minAmount) {
      const amountDisplay = sdkAmount.display(minAmount);
      return {
        error: `Amount too small (min ~${amountDisplay} ${props.tokenSymbol})`,
      };
    } else {
      return {
        error: 'No routes found for this transaction.',
      };
    }
  }

  // MinQuote warnings information
  if (minAmount) {
    const amountDisplay = sdkAmount.display(minAmount);
    return {
      warning: `More routes available for amounts exceeding ${amountDisplay} ${props.tokenSymbol}`,
    };
  }

  return {};
};
