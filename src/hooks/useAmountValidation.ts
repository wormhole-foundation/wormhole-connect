import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { QuoteResult } from 'routes/operator';
import { RootState } from 'store';
import { isMinAmountError } from 'utils/sdkv2';

export type AmountValidationResult = {
  error?: string;
  warning?: string;
};

type Props = {
  balance?: sdkAmount.Amount | null;
  routes: string[];
  quotes: Record<string, QuoteResult | undefined>;
  tokenSymbol: string;
  isLoading: boolean;
  disabled?: boolean;
};

export const useAmountValidation = (props: Props): AmountValidationResult => {
  const { amount } = useSelector((state: RootState) => state.transferInput);

  // Min amount available
  const minAmount = useMemo(
    () =>
      Object.values(props.quotes).reduce((minAmount, quoteResult) => {
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
    [props.quotes],
  );

  const allRoutesFailed = useMemo(() => {
    if (Object.keys(props.quotes).length === 0) {
      return false;
    }

    return props.routes.every((route) => {
      return props.quotes[route]?.success === false;
    });
  }, [props.routes, props.quotes]);

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
        error: 'No routes found for this transaction amount.',
      };
    }
  }

  // MinQuote warnings information
  if (minAmount) {
    const formattedAmount = sdkAmount.display(minAmount);
    return {
      warning: `More routes available for ${formattedAmount} ${props.tokenSymbol} or more.`,
    };
  }

  return {};
};
