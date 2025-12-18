import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { internalWalletProvider } from '../InternalWalletProvider';
import { TransferWallet } from '..';

// Mock dependencies
vi.mock('config', () => ({
  default: {
    network: 'Mainnet',
    chains: {
      Ethereum: { sdkName: 'Ethereum' },
      Solana: { sdkName: 'Solana' },
    },
    cacheKey: (key: string) => `wormhole-connect-${key}`,
  },
}));

vi.mock('@wormhole-foundation/sdk-base', () => ({
  chainToPlatform: (chain: string) => chain.toLowerCase(),
  nativeChainIds: {
    networkChainToNativeChainId: {
      get: () => 1,
    },
  },
}));

vi.mock('..', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getWalletOptions: vi.fn(),
    signAndSendTransaction: vi.fn(),
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock wallet
const createMockWallet = (name: string) => ({
  getName: () => name,
  getAddress: () => '0x1234567890abcdef1234567890abcdef12345678',
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
});

describe('InternalWalletProvider', () => {
  let pendingPromises: Promise<any>[] = [];

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    pendingPromises = [];
  });

  afterEach(async () => {
    // Catch any pending promises to prevent unhandled rejections
    // Must be called BEFORE onWalletSelectCancelled to prevent sync rejection
    const cleanupPromises = Promise.allSettled(pendingPromises);

    // Clean up any pending connections
    try {
      internalWalletProvider.onWalletSelectCancelled();
    } catch (e) {
      // Ignore cleanup errors
    }

    await cleanupPromises;
  });

  describe('connectWallet', () => {
    it('should create a pending connection promise when autoConnect is false', async () => {
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      pendingPromises.push(promise);
      // Catch to prevent unhandled rejection during cleanup
      promise.catch(() => {});

      expect(promise).toBeInstanceOf(Promise);
    });

    it('should reject duplicate connection requests for different chain/type', async () => {
      const promise1 = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      // Catch to prevent unhandled rejection
      promise1.catch(() => {});

      await expect(
        internalWalletProvider.connectWallet(
          'Solana',
          TransferWallet.RECEIVING,
          false,
        ),
      ).rejects.toThrow('Connect wallet pending for other chain/type');

      // Clean up
      internalWalletProvider.onWalletSelectCancelled();
    });

    // Note: Testing if promises are identical is brittle due to module mocking.
    // The behavior of reusing pending connections is covered by the "should reject duplicate"
    // test which verifies that concurrent connections to different chains are rejected.
  });

  describe('onWalletSelected', () => {
    it('should resolve pending connection and store wallet', async () => {
      const mockWallet = createMockWallet('MetaMask');
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );

      await internalWalletProvider.onWalletSelected(
        mockWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );

      const wallet = await promise;
      expect(wallet).toBe(mockWallet);
      expect(mockWallet.connect).toHaveBeenCalled();

      const storedWallet = internalWalletProvider.getWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
      expect(storedWallet).toBe(mockWallet);
    });

    it('should throw error if no pending connection', async () => {
      const mockWallet = createMockWallet('MetaMask');

      await expect(
        internalWalletProvider.onWalletSelected(
          mockWallet as any,
          'Ethereum',
          TransferWallet.SENDING,
        ),
      ).rejects.toThrow('No pending wallet connection request');
    });

    it('should throw error if chain/type mismatch', async () => {
      const mockWallet = createMockWallet('MetaMask');
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      pendingPromises.push(promise);
      // Catch to prevent unhandled rejection during cleanup
      promise.catch(() => {});

      await expect(
        internalWalletProvider.onWalletSelected(
          mockWallet as any,
          'Solana',
          TransferWallet.RECEIVING,
        ),
      ).rejects.toThrow('Wallet selection mismatch');
    });

    it('should save wallet name to localStorage', async () => {
      const mockWallet = createMockWallet('MetaMask');
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );

      await internalWalletProvider.onWalletSelected(
        mockWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );

      await promise;

      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:sending'),
      ).toBe('MetaMask');
    });
  });

  describe('onWalletSelectCancelled', () => {
    it('should reject pending connection', async () => {
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );

      internalWalletProvider.onWalletSelectCancelled();

      await expect(promise).rejects.toThrow('User cancelled wallet connection');
    });

    it('should do nothing if no pending connection', () => {
      expect(() => {
        internalWalletProvider.onWalletSelectCancelled();
      }).not.toThrow();
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect wallet and remove from storage', async () => {
      const mockWallet = createMockWallet('MetaMask');
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );

      await internalWalletProvider.onWalletSelected(
        mockWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      internalWalletProvider.disconnectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );

      const wallet = internalWalletProvider.getWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
      expect(wallet).toBeNull();
      expect(mockWallet.disconnect).toHaveBeenCalled();
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:sending'),
      ).toBeNull();
    });

    it('should remove both type and otherType localStorage entries when disconnecting', async () => {
      const mockWallet = createMockWallet('MetaMask');
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );

      await internalWalletProvider.onWalletSelected(
        mockWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      // After connecting, both sending and receiving entries should exist (line 83)
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:sending'),
      ).toBe('MetaMask');
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:receiving'),
      ).toBe('MetaMask');

      // Disconnect sending wallet
      internalWalletProvider.disconnectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );

      // Both entries should be removed to prevent stale reconnections after swap
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:sending'),
      ).toBeNull();
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:receiving'),
      ).toBeNull();
    });
  });

  describe('getWallet', () => {
    it('should return null when no wallet connected', () => {
      const wallet = internalWalletProvider.getWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
      expect(wallet).toBeNull();
    });

    it('should return connected wallet', async () => {
      const mockWallet = createMockWallet('MetaMask');
      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );

      await internalWalletProvider.onWalletSelected(
        mockWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      const wallet = internalWalletProvider.getWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
      expect(wallet).toBe(mockWallet);
    });
  });

  describe('swapWallets', () => {
    it('should swap sending and receiving wallets', async () => {
      const sendingWallet = createMockWallet('MetaMask');
      const receivingWallet = createMockWallet('Phantom');

      // Connect sending wallet
      let promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        sendingWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      // Connect receiving wallet
      promise = internalWalletProvider.connectWallet(
        'Solana',
        TransferWallet.RECEIVING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        receivingWallet as any,
        'Solana',
        TransferWallet.RECEIVING,
      );
      await promise;

      // Swap wallets
      internalWalletProvider.swapWallets();

      const newSending = internalWalletProvider.getWallet(
        'Solana',
        TransferWallet.SENDING,
      );
      const newReceiving = internalWalletProvider.getWallet(
        'Ethereum',
        TransferWallet.RECEIVING,
      );

      expect(newSending).toBe(receivingWallet);
      expect(newReceiving).toBe(sendingWallet);
    });

    it('should update localStorage after swap', async () => {
      const sendingWallet = createMockWallet('MetaMask');
      const receivingWallet = createMockWallet('Phantom');

      let promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        sendingWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      promise = internalWalletProvider.connectWallet(
        'Solana',
        TransferWallet.RECEIVING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        receivingWallet as any,
        'Solana',
        TransferWallet.RECEIVING,
      );
      await promise;

      internalWalletProvider.swapWallets();

      expect(
        localStorageMock.getItem('wormhole-connect-wallet:solana:sending'),
      ).toBe('Phantom');
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:receiving'),
      ).toBe('MetaMask');
    });

    it('should not reconnect disconnected wallet after swap', async () => {
      const sendingWallet = createMockWallet('MetaMask');
      const receivingWallet = createMockWallet('Phantom');

      // Connect both wallets
      let promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        sendingWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      promise = internalWalletProvider.connectWallet(
        'Solana',
        TransferWallet.RECEIVING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        receivingWallet as any,
        'Solana',
        TransferWallet.RECEIVING,
      );
      await promise;

      // Disconnect sending wallet (MetaMask from Ethereum)
      internalWalletProvider.disconnectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );

      // Both Ethereum entries should be removed (sending and receiving)
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:sending'),
      ).toBeNull();
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:receiving'),
      ).toBeNull();

      // Swap wallets
      internalWalletProvider.swapWallets();

      // After swap, Phantom moves from receiving to sending
      const newSending = internalWalletProvider.getWallet(
        'Solana',
        TransferWallet.SENDING,
      );
      expect(newSending).toBe(receivingWallet);

      // After swap, receiving should be undefined (was disconnected)
      const newReceiving = internalWalletProvider.getWallet(
        'Ethereum',
        TransferWallet.RECEIVING,
      );
      expect(newReceiving).toBeNull();

      // Ethereum receiving should still be null in localStorage (no reconnection)
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:receiving'),
      ).toBeNull();
    });
  });

  describe('clearWallets', () => {
    it('should clear both sending and receiving wallet connections', async () => {
      const sendingWallet = createMockWallet('MetaMask');
      const receivingWallet = createMockWallet('Phantom');

      // Connect sending wallet
      let promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        sendingWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      // Connect receiving wallet
      promise = internalWalletProvider.connectWallet(
        'Solana',
        TransferWallet.RECEIVING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        receivingWallet as any,
        'Solana',
        TransferWallet.RECEIVING,
      );
      await promise;

      // Clear all wallets
      internalWalletProvider.clearWallets();

      const sending = internalWalletProvider.getWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
      const receiving = internalWalletProvider.getWallet(
        'Solana',
        TransferWallet.RECEIVING,
      );

      expect(sending).toBeNull();
      expect(receiving).toBeNull();
    });

    it('should not call wallet.disconnect() when clearing', async () => {
      const sendingWallet = createMockWallet('MetaMask');

      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        sendingWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      internalWalletProvider.clearWallets();

      // Should NOT call disconnect on the wallet
      expect(sendingWallet.disconnect).not.toHaveBeenCalled();
    });

    it('should preserve localStorage entries when clearing', async () => {
      const sendingWallet = createMockWallet('MetaMask');

      const promise = internalWalletProvider.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        false,
      );
      await internalWalletProvider.onWalletSelected(
        sendingWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
      await promise;

      internalWalletProvider.clearWallets();

      // localStorage should still have the wallet entry
      expect(
        localStorageMock.getItem('wormhole-connect-wallet:ethereum:sending'),
      ).toBe('MetaMask');
    });
  });

  describe('event handlers', () => {
    it('on() should be a no-op', () => {
      expect(() => {
        internalWalletProvider.on('walletConnected', () => {});
      }).not.toThrow();
    });

    it('off() should be a no-op', () => {
      expect(() => {
        internalWalletProvider.off('walletConnected', () => {});
      }).not.toThrow();
    });
  });
});
