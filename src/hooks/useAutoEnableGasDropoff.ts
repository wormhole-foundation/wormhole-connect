import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import type { Balances } from 'utils/wallet/types';
import config from 'config';
import { setToNativeToken } from 'store/relay';

export interface UseAutoEnableGasDropOffParams {
  route: string | undefined;
  destChain: Chain | undefined;
  receivingWalletAddress: string | undefined;
  destinationBalances: Balances;
  hasUserManuallyChangedGas: boolean;
  currentToNativeToken: number;
}

/**
 * Automatically enables gas drop-off when the destination
 * wallet has zero native token balance, unless the user has manually changed
 * the gas setting.
 */
export function useAutoEnableGasDropOff({
  route,
  destChain,
  receivingWalletAddress,
  destinationBalances,
  hasUserManuallyChangedGas,
  currentToNativeToken,
}: UseAutoEnableGasDropOffParams): void {
  const dispatch = useDispatch();

  useEffect(() => {
    if (
      !route ||
      !destChain ||
      !receivingWalletAddress ||
      hasUserManuallyChangedGas
    ) {
      return;
    }

    const nativeGasToken = config.tokens.getGasToken(destChain);
    if (!nativeGasToken) {
      return;
    }

    const nativeBalance = destinationBalances[nativeGasToken.key];
    const hasBalance =
      nativeBalance?.balance && sdkAmount.units(nativeBalance.balance) > 0n;

    if (hasBalance) {
      return;
    }

    const newGasValue = 1;

    if (newGasValue !== currentToNativeToken) {
      dispatch(setToNativeToken(newGasValue));
    }
  }, [
    route,
    destChain,
    destinationBalances,
    receivingWalletAddress,
    hasUserManuallyChangedGas,
    currentToNativeToken,
    dispatch,
  ]);
}
