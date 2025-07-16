import { Middleware } from '@reduxjs/toolkit';
import { chainToPlatform } from '@wormhole-foundation/sdk';
import config from 'config';
import { WalletStateChangeCallback } from 'config/externalWallet';
import {
  connectWallet as connectSourceWallet,
  connectReceivingWallet,
  clearWallet,
} from 'store/wallet';
import { TransferWallet } from 'utils/wallet';

/**
 * Redux middleware that handles external wallet state synchronization
 */
export const externalWalletMiddleware: Middleware =
  (store) => (next) => (action) => {
    // Process the action normally first
    const result = next(action);

    // Handle external wallet synchronization if configured
    if (config.externalWalletManager) {
      // You can add action-specific external wallet logic here if needed
      // For now, we'll handle state changes through the callback system
    }

    return result;
  };

/**
 * Initialize external wallet state synchronization
 * This should be called once when the store is created
 */
export const initializeExternalWalletSync = (store: any) => {
  if (!config.externalWalletManager) {
    return;
  }

  const handleWalletStateChange: WalletStateChangeCallback = (type, state) => {
    if (state.isConnected && state.address && state.chain) {
      // Wallet is connected - update Redux state
      const payload = {
        address: state.address,
        type: chainToPlatform(state.chain),
        icon: state.walletIcon || '',
        name: state.walletName || 'External Wallet',
      };

      if (type === 'sending') {
        store.dispatch(connectSourceWallet(payload));
      } else {
        store.dispatch(connectReceivingWallet(payload));
      }
    } else {
      // Wallet is disconnected - clear Redux state
      const transferWalletType =
        type === 'sending' ? TransferWallet.SENDING : TransferWallet.RECEIVING;

      store.dispatch(clearWallet(transferWalletType));
    }
  };

  // Register the callback with the external wallet manager
  config.externalWalletManager.onWalletStateChanged(handleWalletStateChange);

  // Initial sync - check current wallet states
  const syncInitialState = async () => {
    try {
      // Sync sending wallet
      const sendingState = await config.externalWalletManager!.getWalletState(
        'sending',
      );
      handleWalletStateChange('sending', sendingState);

      // Sync receiving wallet
      const receivingState = await config.externalWalletManager!.getWalletState(
        'receiving',
      );
      handleWalletStateChange('receiving', receivingState);
    } catch (error) {
      console.error('Failed to sync initial external wallet state:', error);
    }
  };

  syncInitialState();
};
