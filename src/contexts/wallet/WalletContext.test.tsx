import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContext } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WalletProvider from './WalletProvider';
import WalletContext from './WalletContext';
import { internalWalletProvider } from 'utils/wallet/InternalWalletProvider';
import { TransferWallet } from 'utils/wallet';

const mockStore = configureStore({
  reducer: {
    wallet: (state = { sending: undefined, receiving: undefined }) => state,
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
  const mockSendingWallet = {
    getAddress: vi.fn(() => '0xE104483eb3a823F244ACE1553ce7Ba3bb2CBCfF3'),
    getName: vi.fn(() => 'TestSendingWallet'),
    getIcon: vi.fn(() => 'sending-wallet-icon.png'),
    getUrl: vi.fn(() => 'https://sendingwallet.com'),
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  const mockReceivingWallet = {
    getAddress: vi.fn(() => '7gw96i3Bs4dp3xsvtimJe6Uf5FHj2e1ik9pVRnpPf4BF'),
    getName: vi.fn(() => 'TestReceivingWallet'),
    getIcon: vi.fn(() => 'receiving-wallet-icon.png'),
    getUrl: vi.fn(() => 'https://receivingwallet.com'),
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

    const { connectWallet, connectReceivingWallet, clearWallet } = await import(
      'store/wallet'
    );

    // Sending wallet (Ethereum)
    let sendingWallet: any;
    await act(async () => {
      const sendingConnectPromise = result.current!.connectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );

      internalWalletProvider.onWalletSelected(
        mockSendingWallet as any,
        'Ethereum',
        TransferWallet.SENDING,
      );

      sendingWallet = await sendingConnectPromise;
    });

    expect(sendingWallet).toBe(mockSendingWallet);

    expect(connectWallet).toHaveBeenCalledWith({
      address: '0xE104483eb3a823F244ACE1553ce7Ba3bb2CBCfF3',
      type: 'Evm',
      icon: 'sending-wallet-icon.png',
      name: 'TestSendingWallet',
    });
    expect(mockSendingWallet.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    );

    // Receiving wallet (Solana)
    let receivingWallet: any;
    await act(async () => {
      const receivingConnectPromise = result.current!.connectWallet(
        'Solana',
        TransferWallet.RECEIVING,
      );

      internalWalletProvider.onWalletSelected(
        mockReceivingWallet as any,
        'Solana',
        TransferWallet.RECEIVING,
      );

      receivingWallet = await receivingConnectPromise;
    });

    expect(receivingWallet).toBe(mockReceivingWallet);

    expect(connectReceivingWallet).toHaveBeenCalledWith({
      address: '7gw96i3Bs4dp3xsvtimJe6Uf5FHj2e1ik9pVRnpPf4BF',
      type: 'Solana',
      icon: 'receiving-wallet-icon.png',
      name: 'TestReceivingWallet',
    });
    expect(mockReceivingWallet.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    );

    // Disconnect sending
    await act(async () => {
      await result.current!.disconnectWallet(
        'Ethereum',
        TransferWallet.SENDING,
      );
    });

    expect(mockSendingWallet.disconnect).toHaveBeenCalled();
    expect(clearWallet).toHaveBeenCalledWith(TransferWallet.SENDING);

    // Disconnect receiving
    await act(async () => {
      await result.current!.disconnectWallet(
        'Solana',
        TransferWallet.RECEIVING,
      );
    });

    expect(mockReceivingWallet.disconnect).toHaveBeenCalled();
    expect(clearWallet).toHaveBeenCalledWith(TransferWallet.RECEIVING);
  });
});
