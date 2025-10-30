import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { amount } from '@wormhole-foundation/sdk';
import { useAutoEnableGasDropOff } from './useAutoEnableGasDropoff';
import * as relayActions from 'store/relay';

vi.mock('config', () => ({
  default: {
    tokens: {
      getGasToken: vi.fn(() => ({ key: 'ETH', symbol: 'ETH' })),
    },
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
    <Provider store={mockStore}>{children}</Provider>
  );

  it('enables gas dropoff when destination has no native balance', () => {
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
          destChain: 'Optimism',
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
          destChain: 'Optimism',
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
          destChain: 'Optimism',
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
          destChain: 'Optimism',
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
          destChain: 'Optimism',
          receivingWalletAddress: '0x456',
          destinationBalances: {},
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 1,
          isFetchingBalances: true,
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
          destChain: 'Optimism',
          receivingWalletAddress: '0x456',
          destinationBalances: {},
          hasUserManuallyChangedGas: false,
          currentToNativeToken: 0,
          isFetchingBalances: true,
        }),
      { wrapper },
    );

    expect(setToNativeTokenSpy).not.toHaveBeenCalled();
  });
});
