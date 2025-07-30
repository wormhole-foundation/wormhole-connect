import { useMemo } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import type { WalletData } from '../store/wallet';

export type WalletCompatibilityResult = {
  isCompatible: boolean;
  warning?: string;
};

export const useWalletCompatibility = ({
  sendingWallet,
  receivingWallet,
  sourceChain,
  destChain,
  routes,
}: {
  sendingWallet: WalletData;
  receivingWallet: WalletData;
  sourceChain?: Chain;
  destChain?: Chain;
  routes: string[];
}): WalletCompatibilityResult => {
  return useMemo(() => {
    const isManualCCTPRoute = routes.length === 1 && routes[0] === 'ManualCCTP';

    if (isManualCCTPRoute) {
      // Aptos CCTP requires modern (AIP-62 standard) wallets with support for signing move script transaction types
      // NOTE: This package is missing some of the wallet types, so we're using a string array instead
      // import { type AvailableWallets } from '@aptos-labs/wallet-adapter-core';
      const compatibleWallets: string[] = [
        'Petra',
        'Pontem Wallet',
        'Nightly',
        'Continue with Google',
        'Continue with Apple',
      ];
      if (
        (sourceChain === 'Aptos' &&
          !compatibleWallets.includes(sendingWallet.name)) ||
        (destChain === 'Aptos' &&
          !compatibleWallets.includes(receivingWallet.name))
      ) {
        return {
          isCompatible: false,
          warning: 'Please use a compatible wallet for this route.',
        };
      }
    }

    return { isCompatible: true };
  }, [sendingWallet, receivingWallet, sourceChain, destChain, routes]);
};
