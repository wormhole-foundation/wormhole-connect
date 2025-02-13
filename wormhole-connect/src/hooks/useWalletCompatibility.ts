import { useMemo } from 'react';
import { Chain } from '@wormhole-foundation/sdk';
import { WalletData } from '../store/wallet';
import { type AvailableWallets } from '@aptos-labs/wallet-adapter-core';

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
      const compatibleWallets: AvailableWallets[] = [
        'Petra',
        'Pontem Wallet',
        'Nightly',
      ];
      if (
        (sourceChain === 'Aptos' &&
          !compatibleWallets.includes(
            sendingWallet.name as AvailableWallets,
          )) ||
        (destChain === 'Aptos' &&
          !compatibleWallets.includes(receivingWallet.name as AvailableWallets))
      ) {
        return {
          isCompatible: false,
          warning: `Please use ${compatibleWallets.join(
            ' or ',
          )} with the Aptos CCTP route.`,
        };
      }
    }

    return { isCompatible: true };
  }, [sendingWallet, receivingWallet, sourceChain, destChain, routes]);
};
