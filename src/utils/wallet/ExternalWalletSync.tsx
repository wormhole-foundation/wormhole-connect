import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import config from 'config';
import {
  connectWallet as connectSourceWallet,
  connectReceivingWallet,
  clearWallet,
} from 'store/wallet';
import { WalletStateChangeCallback } from 'config/externalWallet';
import { TransferWallet } from './index';
import { chainToPlatform } from '@wormhole-foundation/sdk';

/**
 * Component that handles synchronization between external wallet state
 * and Connect's internal Redux store when external wallet manager is configured
 */
export const ExternalWalletSync: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!config.externalWalletManager?.onWalletStateChanged) {
      return;
    }

    const handleWalletStateChange: WalletStateChangeCallback = (
      type,
      state,
    ) => {
      if (state.isConnected && state.address) {
        // Wallet is connected - update Redux state
        const payload = {
          address: state.address,
          type: chainToPlatform(state.chainId as any) || 'Evm', // fallback to Evm
          icon: state.walletIcon || '',
          name: state.walletName || 'External Wallet',
        };

        if (type === 'sending') {
          dispatch(connectSourceWallet(payload));
        } else {
          dispatch(connectReceivingWallet(payload));
        }
      } else {
        // Wallet is disconnected - clear Redux state
        const transferWalletType =
          type === 'sending'
            ? TransferWallet.SENDING
            : TransferWallet.RECEIVING;

        dispatch(clearWallet(transferWalletType));
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
        const receivingState =
          await config.externalWalletManager!.getWalletState('receiving');
        handleWalletStateChange('receiving', receivingState);
      } catch (error) {
        console.error('Failed to sync initial external wallet state:', error);
      }
    };

    syncInitialState();
  }, [dispatch]);

  // This component doesn't render anything
  return null;
};
