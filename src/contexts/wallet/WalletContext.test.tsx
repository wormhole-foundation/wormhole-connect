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
import { Chain } from 'exports';

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
  const mockWallet = {
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

  it('connect and disconnect sending and receiving wallets', async () => {
    const { result } = renderHook(() => useContext(WalletContext), {
      wrapper,
    });

    expect(result.current).toBeDefined();
    expect(result.current?.walletProvider).toBe(internalWalletProvider);
    expect(result.current?.isConnecting).toBe(false);
    expect(result.current?.connectWallet).toBeDefined();
    expect(result.current?.disconnectWallet).toBeDefined();
    expect(result.current?.swapWallets).toBeDefined();

    const { connectWallet, connectReceivingWallet, clearWallet } = await import(
      'store/wallet'
    );

    // Test sending wallet (Ethereum) - connect
    vi.mocked(mockWallet.getAddress).mockReturnValue(
      '0xE104483eb3a823F244ACE1553ce7Ba3bb2CBCfF3',
    );

    let sendingConnectPromise: Promise<any>;
    act(() => {
      sendingConnectPromise = result.current!.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    expect(result.current?.isConnecting).toBe(true);

    act(() => {
      internalWalletProvider.onWalletSelected(
        mockWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    const sendingWallet = await sendingConnectPromise!;

    await waitFor(() => {
      expect(result.current?.isConnecting).toBe(false);
    });

    expect(sendingWallet).toBe(mockWallet);
    expect(connectWallet).toHaveBeenCalledWith({
      address: '0xE104483eb3a823F244ACE1553ce7Ba3bb2CBCfF3',
      type: 'Evm',
      icon: 'wallet-icon.png',
      name: 'TestWallet',
    });
    expect(mockWallet.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    );
    expect(mockWallet.on).toHaveBeenCalledWith(
      'accountsChanged',
      expect.any(Function),
    );

    vi.mocked(mockWallet.on).mockClear();

    // Test receiving wallet (Solana) - connect
    vi.mocked(mockWallet.getAddress).mockReturnValue(
      '7gw96i3Bs4dp3xsvtimJe6Uf5FHj2e1ik9pVRnpPf4BF',
    );

    let receivingConnectPromise: Promise<any>;
    act(() => {
      receivingConnectPromise = result.current!.connectWallet(
        'Solana',
        TransferWallet.RECEIVING,
      );
    });

    act(() => {
      internalWalletProvider.onWalletSelected(
        mockWallet as any,
        'Solana',
        TransferWallet.RECEIVING,
      );
    });

    const receivingWallet = await receivingConnectPromise!;

    expect(receivingWallet).toBe(mockWallet);
    expect(connectReceivingWallet).toHaveBeenCalledWith({
      address: '7gw96i3Bs4dp3xsvtimJe6Uf5FHj2e1ik9pVRnpPf4BF',
      type: 'Solana',
      icon: 'wallet-icon.png',
      name: 'TestWallet',
    });
    expect(mockWallet.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    );
    expect(mockWallet.on).toHaveBeenCalledWith(
      'accountsChanged',
      expect.any(Function),
    );

    // Test sending wallet disconnect
    await act(async () => {
      await result.current!.disconnectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
    });
    expect(mockWallet.disconnect).toHaveBeenCalled();
    expect(clearWallet).toHaveBeenCalledWith(TransferWallet.SENDING);

    // Test receiving wallet disconnect
    await act(async () => {
      await result.current!.disconnectWallet(
        'Solana',
        TransferWallet.RECEIVING,
      );
    });
    expect(clearWallet).toHaveBeenCalledWith(TransferWallet.RECEIVING);
  });
});
