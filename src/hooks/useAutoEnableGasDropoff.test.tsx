import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { amount } from '@wormhole-foundation/sdk';
import { useAutoEnableGasDropOff } from './useAutoEnableGasDropoff';
import * as relayActions from 'store/relay';
import { TestConfigContext } from 'utils/testHelpers';

// Mock config object provided via TestConfigContext
const mockConfig = {
  tokens: {
    getGasToken: vi.fn(() => ({ key: 'ETH', symbol: 'ETH' })),
  },
};

// Mock useConfig to read from TestConfigContext
vi.mock('contexts/ConfigContext', () => ({
  useConfig: () => {
    const context = React.useContext(TestConfigContext);
    if (!context) {
      throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
  },
}));

describe('useAutoEnableGasDropoff', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setToNativeTokenSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    setToNativeTokenSpy = vi.spyOn(relayActions, 'setToNativeToken');

    mockStore = configureStore({
      reducer: {
        relay: (state = { toNativeToken: 0 }) => state,
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestConfigContext.Provider value={mockConfig}>
      <Provider store={mockStore}>{children}</Provider>
    </TestConfigContext.Provider>
  );

  it('enables gas dropoff when destination has no native balance and chain is allowed', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).toHaveBeenCalledWith(1);
  });

  it('does not enable gas dropoff when destination has native balance', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(1000000000000000000n, 18), // 1 ETH
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('does not enable gas dropoff when user has manually changed gas', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: true,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('does not enable gas dropoff when route is not set', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: undefined,
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('does not enable gas dropoff when receiving wallet is not connected', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: undefined,
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('does not call dispatch when toNativeToken is already set to 1', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 1,
          isFetchingBalances: false,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('sets gas to 0 when balances are being fetched', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {},
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 1,
          isFetchingBalances: true,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).toHaveBeenCalledWith(0);
  });

  it('does not call dispatch when balances are being fetched and gas is already 0', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {},
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: true,
          allowedChains: ['Monad'],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('does not enable gas dropoff when chain is not in allowed list', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Optimism',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          allowedChains: ['Monad'], // Optimism is not in the list
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('does not enable gas dropoff when allowedChains is empty', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          allowedChains: [],
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });

  it('does not enable gas dropoff when allowedChains is not provided', () => {
    renderHook(
      () =>
        useAutoEnableGasDropOff({
          route: 'TokenBridgeExecutorRoute',
          destChain: 'Monad',
          receivingWalletAddress: '0x456',
          destinationBalances: {
            ETH: {
              balance: amount.fromBaseUnits(0n, 18),
              lastUpdated: Date.now(),
            },
          },
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: false,
          // No allowedChains provided
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });
});
