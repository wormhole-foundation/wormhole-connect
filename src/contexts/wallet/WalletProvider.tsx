import type { ReactNode } from 'react';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { chainToPlatform } from '@wormhole-foundation/sdk';
import { useDispatch } from 'react-redux';
import config from 'config';
import type { Wallet, WormholeConnectWalletProvider } from 'utils/wallet';
import { TransferWallet } from 'utils/wallet';
import {
  clearWallet,
  connectWallet as connectSourceWallet,
  connectReceivingWallet,
  swapWallets as swapWalletsAction,
} from 'store/wallet';
import WalletContext from './WalletContext';

export interface WalletProviderProps {
  children: ReactNode;
  provider: WormholeConnectWalletProvider;
}

function WalletProvider({
  children,
  provider: walletProvider,
}: WalletProviderProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const dispatch = useDispatch();

  const setupWalletConnection = useCallback(
    (wallet: Wallet, chain: Chain, type: TransferWallet): void => {
      const address = wallet.getAddress();
      if (!address) {
        throw new Error('Wallet is not connected');
      }

      const payload = {
        address,
        type: chainToPlatform(chain),
        icon: wallet.getIcon(),
        name: wallet.getName(),
      };

      if (type === TransferWallet.SENDING) {
        dispatch(connectSourceWallet(payload));
      } else {
        dispatch(connectReceivingWallet(payload));
      }

      const handleAccountsChanged = (accounts: string[]) => {
        const shouldDisconnect =
          accounts.length === 0 ||
          (accounts.length && address && accounts[0] !== address);

        if (shouldDisconnect) {
          walletProvider.disconnectWallet(chain, type);
        }
      };

      const handleDisconnect = () => {
        if (wallet === walletProvider.getWallet(chain, type)) {
          // This is still not entirely correct, but better than before.
          // type can mutate, while closures maintain reference to old
          // type. Ideally wallet sdk should expose another event
          // called walletAppDisconnect, and then one can listen to that
          // and clear all wallets here. Manual disconnect via our UI is
          // handled via the disconnectWallet() function.
          dispatch(clearWallet(type));
        }

        wallet.off('disconnect', handleDisconnect);
        wallet.off('accountsChanged', handleAccountsChanged);
      };

      wallet.on('disconnect', handleDisconnect);
      wallet.on('accountsChanged', handleAccountsChanged);

      config.triggerEvent({
        type: 'wallet.connect',
        details: {
          side: type,
          chain,
          wallet: wallet.getName().toLowerCase(),
          address: wallet.getAddress(),
        },
      });
    },
    [dispatch, walletProvider],
  );

  useEffect(() => {
    walletProvider.on('walletConnected', setupWalletConnection);

    return () => {
      walletProvider.off('walletConnected', setupWalletConnection);
    };
  }, [walletProvider, setupWalletConnection]);

  const connectWallet = useCallback(
    async (
      chain: Chain,
      type: TransferWallet,
      autoConnect?: boolean,
    ): Promise<Wallet | null> => {
      setIsConnecting(true);
      try {
        const wallet = await walletProvider.connectWallet(
          chain,
          type,
          autoConnect,
        );
        if (wallet) {
          setupWalletConnection(wallet, chain, type);
        }
        return wallet;
      } catch {
        return null;
      } finally {
        setIsConnecting(false);
      }
    },
    [setupWalletConnection, walletProvider],
  );

  const swapWallets = useCallback((): void => {
    walletProvider.swapWallets();
    dispatch(swapWalletsAction());
  }, [dispatch, walletProvider]);

  const disconnectWallet = useCallback(
    (chain: Chain, type: TransferWallet) => {
      walletProvider.disconnectWallet(chain, type);
      dispatch(clearWallet(type));
    },
    [dispatch, walletProvider],
  );

  const contextValue = useMemo(
    () => ({
      connectWallet,
      swapWallets,
      disconnectWallet,
      walletProvider,
      isConnecting,
    }),
    [
      connectWallet,
      swapWallets,
      disconnectWallet,
      walletProvider,
      isConnecting,
    ],
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export default WalletProvider;
