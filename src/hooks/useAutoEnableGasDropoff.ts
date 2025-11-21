import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { Chain } from '@wormhole-foundation/sdk';
import type { Balances } from 'utils/wallet/types';
import config from 'config';
import { setToNativeToken } from 'store/relay';
import { isExecutorRoute } from 'utils';

export interface UseAutoEnableGasDropOffParams {
  route: string | undefined;
  destChain: Chain | undefined;
  receivingWalletAddress: string | undefined;
  destinationBalances: Balances;
  hasUserManuallyChangedGas: boolean;
  currentToNativeToken: number;
  isFetchingBalances: boolean;
  allowedChains?: Chain[];
}

/**
 * Automatically enables gas drop-off when the destination
 * wallet has zero native token balance for executor routes,
 * unless the user has manually changed the gas setting.
 * Only applies to chains specified in allowedChains if provided.
 */
export function useAutoEnableGasDropOff({
  route,
  destChain,
  receivingWalletAddress,
  destinationBalances,
  hasUserManuallyChangedGas,
  currentToNativeToken,
  isFetchingBalances,
  allowedChains,
}: UseAutoEnableGasDropOffParams): void {
  const dispatch = useDispatch();

  useEffect(() => {
    if (
      !route ||
      !isExecutorRoute(route) ||
      !destChain ||
      !receivingWalletAddress ||
      hasUserManuallyChangedGas
    ) {
      return;
    }

    // Check if auto-enable is allowed for this chain
    // If allowedChains is not specified or empty, don't auto-enable for any chain
    if (!allowedChains || allowedChains.length === 0) {
      return;
    }

    // Check if the destination chain is in the allowed list
    if (!allowedChains.includes(destChain)) {
      return;
    }

    const nativeGasToken = config.tokens.getGasToken(destChain);
    if (!nativeGasToken) {
      return;
    }

    // If still fetching balances, set gas to 0
    if (isFetchingBalances) {
      if (currentToNativeToken !== 0) {
        dispatch(setToNativeToken(0));
      }
      return;
    }

    const nativeBalance = destinationBalances[nativeGasToken.key];
    const hasBalance =
      nativeBalance?.balance && sdkAmount.units(nativeBalance.balance) > 0n;

    const newGasValue = hasBalance ? 0 : 1;

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
    isFetchingBalances,
    allowedChains,
    dispatch,
  ]);
}
