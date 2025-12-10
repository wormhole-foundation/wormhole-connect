import { useState, useEffect, useRef } from 'react';
import type { Chain } from '@wormhole-foundation/sdk';
import { TransferWallet } from 'utils/wallet';
import useWalletProvider from 'hooks/useWalletProvider';
import type { WalletData } from 'store/wallet';

function connectToChain(
  chain: Chain | undefined,
  wallet: TransferWallet,
  setIsConnecting: (isConnecting: boolean) => void,
  connectWallet: ReturnType<typeof useWalletProvider>['connectWallet'],
  skipReconnect: boolean,
) {
  if (!chain || skipReconnect) {
    setIsConnecting(false);
    return;
  }

  let isUnmounted = false;

  async function connect() {
    setIsConnecting(true);

    if (chain && !isUnmounted) {
      try {
        await connectWallet(chain, wallet, true);
      } catch {
        // Wallet connection errors are handled by the wallet provider
        // We just need to ensure state is updated
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
}

function useConnectToLastUsedWallet(
  sourceChain?: Chain,
  destChain?: Chain,
  sendingWallet?: WalletData,
  receivingWallet?: WalletData,
): { isConnecting: boolean } {
  const { connectWallet, swapWallets } = useWalletProvider();
  const [isConnectingSource, setIsConnectingSource] = useState(false);
  const [isConnectingDestination, setIsConnectingDestination] = useState(false);

  const prevSourceChainRef = useRef(sourceChain);
  const prevDestChainRef = useRef(destChain);
  const sendingWalletRef = useRef(sendingWallet);
  const receivingWalletRef = useRef(receivingWallet);
  const isSwappingRef = useRef(false);

  // Update wallet refs on every render
  sendingWalletRef.current = sendingWallet;
  receivingWalletRef.current = receivingWallet;

  // Check if both source and destination swapped
  const sourceChanged = sourceChain !== prevSourceChainRef.current;
  const destChanged = destChain !== prevDestChainRef.current;

  const chainsSwapped =
    sourceChanged &&
    destChanged &&
    sourceChain === prevDestChainRef.current &&
    destChain === prevSourceChainRef.current;

  // If chains are swapping we will not be reconnecting any wallets
  // as the wallet provider is just swapping references
  if (chainsSwapped) {
    isSwappingRef.current = true;
  }

  // Effect runs when source chain changes but its not a swap
  useEffect(() => {
    return connectToChain(
      sourceChain,
      TransferWallet.SENDING,
      setIsConnectingSource,
      connectWallet,
      isSwappingRef.current,
    );
  }, [sourceChain, connectWallet]);

  // Effect runs when destination chain changes but its not a swap
  useEffect(() => {
    return connectToChain(
      destChain,
      TransferWallet.RECEIVING,
      setIsConnectingDestination,
      connectWallet,
      isSwappingRef.current,
    );
  }, [destChain, connectWallet]);

  // Effect runs when source wallet changes but its not a swap
  useEffect(() => {
    const shouldSkip =
      // Skip if swapping
      isSwappingRef.current ||
      // Skip if source wallet already exists
      !sendingWallet?.address ||
      // Skip if destination wallet doesn't exist
      !!receivingWalletRef.current?.address;

    return connectToChain(
      prevDestChainRef.current,
      TransferWallet.RECEIVING,
      setIsConnectingDestination,
      connectWallet,
      shouldSkip,
    );
  }, [sendingWallet?.address, connectWallet]);

  // Effect runs when destination wallet changes but its not a swap
  useEffect(() => {
    const shouldSkip =
      // Skip if swapping
      isSwappingRef.current ||
      // Skip if destination wallet already exists
      !receivingWallet?.address ||
      // Skip if source wallet doesn't exist
      !!sendingWalletRef.current?.address;

    return connectToChain(
      prevSourceChainRef.current,
      TransferWallet.SENDING,
      setIsConnectingSource,
      connectWallet,
      shouldSkip,
    );
  }, [receivingWallet?.address, connectWallet]);

  // Effect runs when source and destination change at the same time and its a swap
  useEffect(() => {
    if (chainsSwapped) {
      swapWallets();
    }

    isSwappingRef.current = false;
    prevSourceChainRef.current = sourceChain;
    prevDestChainRef.current = destChain;
  }, [chainsSwapped, swapWallets, sourceChain, destChain]);

  // Effect runs when source and destination change
  useEffect(() => {
    prevSourceChainRef.current = sourceChain;
    prevDestChainRef.current = destChain;
  }, [sourceChain, destChain]);

  return { isConnecting: isConnectingSource || isConnectingDestination };
}

export default useConnectToLastUsedWallet;
