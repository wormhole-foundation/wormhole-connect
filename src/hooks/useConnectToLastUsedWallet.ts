import { useState, useEffect } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { TransferWallet } from 'utils/wallet';
import useWalletProvider from 'hooks/useWalletProvider';

export const useConnectToLastUsedWallet = (
  sourceChain?: Chain,
  destChain?: Chain,
): { isConnecting: boolean } => {
  const { connectWallet } = useWalletProvider();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!sourceChain && !destChain) return;

    let canceled = false;

    const connect = async () => {
      setIsConnecting(true);

      if (sourceChain && !canceled) {
        await connectWallet(sourceChain, TransferWallet.SENDING, true);
      }

      if (destChain && !canceled) {
        await connectWallet(destChain, TransferWallet.RECEIVING, true);
      }

      if (!canceled) {
        setIsConnecting(false);
      }
    };

    connect();

    return () => {
      canceled = true;
    };
  }, [sourceChain, destChain, connectWallet]);

  return { isConnecting };
};
