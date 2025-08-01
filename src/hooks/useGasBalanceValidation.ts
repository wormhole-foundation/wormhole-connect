import { useMemo } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import config from 'config';
import type { QuoteResult } from 'routes/operator';
import type { Balances } from 'utils/wallet/types';

interface UseGasBalanceValidationParams {
  sourceChain?: Chain;
  quote?: QuoteResult;
  balances: Balances;
  isFetching: boolean;
}

interface UseGasBalanceValidationResult {
  error: string;
  isValidating: boolean;
}

const useGasBalanceValidation = ({
  sourceChain,
  quote,
  balances,
  isFetching,
}: UseGasBalanceValidationParams): UseGasBalanceValidationResult => {
  const error = useMemo(() => {
    if (
      !sourceChain ||
      !quote ||
      isFetching ||
      !quote?.success ||
      !quote?.relayFee
    ) {
      return '';
    }

    const chainConfig = config.chains[sourceChain];
    const nativeTokenKey = `${sourceChain}-native`;
    const nativeBalance = balances[nativeTokenKey]?.balance;

    // Can't validate without chain config or native balance
    if (!chainConfig || !nativeBalance) {
      return '';
    }

    const nativeBalanceUnits = sdkAmount.units(nativeBalance);
    const relayFeeUnits = sdkAmount.units(quote.relayFee.amount);

    if (relayFeeUnits > 0n && nativeBalanceUnits < relayFeeUnits) {
      const nativeTokenSymbol = chainConfig.symbol || 'native token';
      const currentBalance = sdkAmount.display(nativeBalance);
      const requiredFee = sdkAmount.display(quote.relayFee.amount);

      return `Insufficient ${nativeTokenSymbol} for gas. You have ${currentBalance} but need at least ${requiredFee}`;
    }

    return '';
  }, [sourceChain, quote, balances, isFetching]);

  return {
    error,
    isValidating: isFetching,
  };
};

export default useGasBalanceValidation;
