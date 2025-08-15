import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WalletProvider from './WalletProvider';
import WalletContext from './WalletContext';
import { internalWalletProvider } from 'utils/wallet/InternalWalletProvider';
import { TransferWallet } from 'utils/wallet';

const mockStore = configureStore({
  reducer: {
    wallet: (state = { sending: null, receiving: null }) => state,
  },
});

vi.mock('config', () => ({
  default: {
    network: 'Mainnet',
    chains: {
      Ethereum: { sdkName: 'Ethereum' },
      Solana: { sdkName: 'Solana' },
    },
    triggerEvent: vi.fn(),
    cacheKey: vi.fn((key: string) => `test-${key}`),
  },
}));

vi.mock('utils/wallet', async () => {
  const actual = await vi.importActual<typeof import('utils/wallet')>(
    'utils/wallet',
  );
  return {
    ...actual,
    getWalletOptions: vi.fn(() => Promise.resolve([])),
  };
});

vi.mock('store/wallet', () => ({
  connectWallet: vi.fn((payload) => ({
    type: 'wallet/connectWallet',
    payload,
  })),
  connectReceivingWallet: vi.fn((payload) => ({
    type: 'wallet/connectReceivingWallet',
    payload,
  })),
  clearWallet: vi.fn((type) => ({
    type: 'wallet/clearWallet',
    payload: type,
  })),
  swapWallets: vi.fn(() => ({
    type: 'wallet/swapWallets',
  })),
}));

describe('WalletContext with InternalWalletProvider', () => {
  const mockWallet: any = {
    getAddress: vi.fn(() => '0xE104483eb3a823F244ACE1553ce7Ba3bb2CBCfF3'),
    getName: vi.fn(() => 'TestWallet'),
    getIcon: vi.fn(() => 'wallet-icon.png'),
    getUrl: vi.fn(() => 'https://testwallet.com'),
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={mockStore}>
      <WalletProvider provider={internalWalletProvider}>
        {children}
      </WalletProvider>
    </Provider>
  );

  it('should provide wallet context with InternalWalletProvider and setup event handlers', async () => {
    const { result } = renderHook(() => useContext(WalletContext), {
      wrapper,
    });

    expect(result.current).toBeDefined();
    expect(result.current?.walletProvider).toBe(internalWalletProvider);
    expect(result.current?.isConnecting).toBe(false);
    expect(result.current?.connectWallet).toBeDefined();
    expect(result.current?.disconnectWallet).toBeDefined();
    expect(result.current?.swapWallets).toBeDefined();

    let connectPromise: Promise<any>;
    act(() => {
      connectPromise = result.current!.connectWallet(
        'Solana',
        TransferWallet.RECEIVING,
      );
    });

    act(() => {
      internalWalletProvider.onWalletSelected(
        mockWallet,
        'Solana',
        TransferWallet.RECEIVING,
      );
    });

    await connectPromise!;

    expect(mockWallet.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    );
    expect(mockWallet.on).toHaveBeenCalledWith(
      'accountsChanged',
      expect.any(Function),
    );
  });

  it('should handle wallet connection through context', async () => {
    const { result } = renderHook(() => useContext(WalletContext), {
      wrapper,
    });

    expect(result.current?.isConnecting).toBe(false);

    let connectPromise: Promise<any>;
    act(() => {
      connectPromise = result.current!.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    expect(result.current?.isConnecting).toBe(true);

    act(() => {
      internalWalletProvider.onWalletSelected(
        mockWallet,
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    const wallet = await connectPromise!;

    await waitFor(() => {
      expect(result.current?.isConnecting).toBe(false);
    });

    expect(wallet).toBe(mockWallet);
  });

  it('should handle wallet disconnection through context', async () => {
    const { result } = renderHook(() => useContext(WalletContext), {
      wrapper,
    });

    let connectPromise: Promise<any>;
    act(() => {
      connectPromise = result.current!.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    act(() => {
      internalWalletProvider.onWalletSelected(
        mockWallet,
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    await connectPromise!;

    await act(async () => {
      await result.current!.disconnectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    expect(mockWallet.disconnect).toHaveBeenCalled();
  });

  it('should handle wallet connection cancellation', async () => {
    const { result } = renderHook(() => useContext(WalletContext), {
      wrapper,
    });

    let connectPromise: Promise<any>;
    act(() => {
      connectPromise = result.current!.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    expect(result.current?.isConnecting).toBe(true);

    await act(async () => {
      internalWalletProvider.onWalletSelectCancelled();
    });

    const wallet = await connectPromise!;
    expect(wallet).toBeNull();

    await waitFor(() => {
      expect(result.current?.isConnecting).toBe(false);
    });
  });

  describe.each([
    { walletType: TransferWallet.SENDING, actionName: 'connectWallet' },
    {
      walletType: TransferWallet.RECEIVING,
      actionName: 'connectReceivingWallet',
    },
  ])('wallet $walletType', ({ walletType, actionName }) => {
    it(`should dispatch ${actionName} action when connecting`, async () => {
      const { result } = renderHook(() => useContext(WalletContext), {
        wrapper,
      });

      const storeActions = await import('store/wallet');
      const connectAction =
        storeActions[actionName as keyof typeof storeActions];

      let connectPromise: Promise<any>;
      act(() => {
        connectPromise = result.current!.connectWallet('Ethereum', walletType);
      });

      act(() => {
        internalWalletProvider.onWalletSelected(
          mockWallet,
          'Ethereum',
          walletType,
        );
      });

      await connectPromise!;

      expect(connectAction).toHaveBeenCalledWith({
        address: '0xE104483eb3a823F244ACE1553ce7Ba3bb2CBCfF3',
        type: 'Evm',
        icon: 'wallet-icon.png',
        name: 'TestWallet',
      });
    });

    it(`should clear wallet address when disconnected`, async () => {
      const { result } = renderHook(() => useContext(WalletContext), {
        wrapper,
      });

      const { clearWallet } = await import('store/wallet');

      let connectPromise: Promise<any>;
      act(() => {
        connectPromise = result.current!.connectWallet('Ethereum', walletType);
      });

      act(() => {
        internalWalletProvider.onWalletSelected(
          mockWallet,
          'Ethereum',
          walletType,
        );
      });

      await connectPromise!;

      await act(async () => {
        await result.current!.disconnectWallet('Ethereum', walletType);
      });

      expect(mockWallet.disconnect).toHaveBeenCalled();
      expect(clearWallet).toHaveBeenCalledWith(walletType);
    });
  });

  it('should handle auto-connect with last used wallet', async () => {
    localStorage.setItem('test-wallet:Evm', 'TestWallet');

    const { getWalletOptions } = await import('utils/wallet');
    vi.mocked(getWalletOptions).mockResolvedValue([
      {
        name: 'TestWallet',
        wallet: mockWallet,
        isReady: true,
      },
    ] as any);

    const { result } = renderHook(() => useContext(WalletContext), {
      wrapper,
    });

    let wallet: any;
    await act(async () => {
      wallet = await result.current!.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
        true,
      );
    });

    expect(wallet).toBe(mockWallet);
    expect(mockWallet.connect).toHaveBeenCalled();
  });
});
