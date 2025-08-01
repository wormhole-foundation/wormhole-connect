import { useMemo } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import config from 'config';
import type { QuoteResult } from 'routes/operator';
import type { Balances } from 'utils/wallet/types';
import type { AmountValidationResult } from 'hooks/useAmountValidation';

interface UseGasBalanceValidationParams {
  sourceChain?: Chain;
  quote?: QuoteResult;
  balances: Balances;
  isFetching: boolean;
}

const useGasBalanceValidation = ({
  sourceChain,
  quote,
  balances,
  isFetching,
}: UseGasBalanceValidationParams): AmountValidationResult => {
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
    const nativeToken = config.tokens.getGasToken(sourceChain);
    const feeToken = config.tokens.get(quote.relayFee.token);
    // Only validate when the relayFee is denominated in the native gas token
    if (!nativeToken || !feeToken || feeToken.key !== nativeToken.key) {
      return '';
    }

    const nativeBalance = balances[nativeToken.key]?.balance;

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

  // Align return type with AmountValidationResult
  return error ? { error } : {};
};

export default useGasBalanceValidation;
