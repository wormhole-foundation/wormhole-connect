import { useState, useEffect, useRef } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { TransferWallet } from 'utils/wallet';
import useWalletProvider from 'hooks/useWalletProvider';
import type { WalletData } from 'store/wallet';

function useConnectToLastUsedWallet(
  sourceChain?: Chain,
  destChain?: Chain,
  sendingWallet?: WalletData,
  receivingWallet?: WalletData,
): { isConnecting: boolean } {
  const { connectWallet, swapWallets } = useWalletProvider();
  const [isConnecting, setIsConnecting] = useState(false);
  const prevSourceChainRef = useRef<Chain | undefined>(undefined);
  const prevDestChainRef = useRef<Chain | undefined>(undefined);
  const prevSendingWalletRef = useRef<WalletData | undefined>(undefined);
  const prevReceivingWalletRef = useRef<WalletData | undefined>(undefined);

  useEffect(() => {
    const hasSourceChainChanged = sourceChain !== prevSourceChainRef.current;
    const hasDestChainChanged = destChain !== prevDestChainRef.current;

    const hasSendingWalletChanged =
      sendingWallet?.address !== prevSendingWalletRef.current?.address;

    const hasReceivingWalletChanged =
      receivingWallet?.address !== prevReceivingWalletRef.current?.address;

    const hasChainsSwapped =
      hasSourceChainChanged &&
      hasDestChainChanged &&
      sourceChain === prevDestChainRef.current &&
      destChain === prevSourceChainRef.current;

    prevSourceChainRef.current = sourceChain;
    prevDestChainRef.current = destChain;
    prevSendingWalletRef.current = sendingWallet;
    prevReceivingWalletRef.current = receivingWallet;

    if (hasChainsSwapped) {
      swapWallets();
      return;
    }

    // Connect to source chain if:
    // 1. Source chain changed, OR
    // 2. Receiving wallet connected but no sending wallet (auto-connect other side)
    const shouldConnectSource =
      hasSourceChainChanged ||
      (hasReceivingWalletChanged &&
        receivingWallet?.address &&
        !sendingWallet?.address);

    // Connect to destination chain if:
    // 1. Destination chain changed, OR
    // 2. Sending wallet connected but no receiving wallet (auto-connect other side)
    const shouldConnectDest =
      hasDestChainChanged ||
      (hasSendingWalletChanged &&
        sendingWallet?.address &&
        !receivingWallet?.address);

    if (!shouldConnectSource && !shouldConnectDest) {
      return;
    }

    let isUnmounted = false;

    async function connect() {
      setIsConnecting(true);

      if (shouldConnectSource && sourceChain && !isUnmounted) {
        try {
          await connectWallet(sourceChain, TransferWallet.SENDING, true);
        } catch {
          // Errors handled by wallet provider
        }
      }

      if (shouldConnectDest && destChain && !isUnmounted) {
        try {
          await connectWallet(destChain, TransferWallet.RECEIVING, true);
        } catch {
          // Errors handled by wallet provider
        }
      }

      if (!isUnmounted) {
        setIsConnecting(false);
      }
    }

    void connect();

    return () => {
      isUnmounted = true;
    };
  }, [
    sourceChain,
    destChain,
    sendingWallet,
    receivingWallet,
    swapWallets,
    connectWallet,
  ]);

  return { isConnecting };
}

export default useConnectToLastUsedWallet;
