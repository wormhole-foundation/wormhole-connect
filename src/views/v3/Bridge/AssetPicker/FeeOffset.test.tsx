import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import FeeOffset from './FeeOffset';
import { dark } from 'theme';

const theme = createTheme({
  palette: dark as any,
});

// Mock the calculateFeeOffset function
vi.mock('utils/fees', () => ({
  calculateFeeOffset: vi.fn(),
}));

// Mock the useGetTokens hook
vi.mock('hooks/useGetTokens', () => ({
  useGetTokens: vi.fn(() => ({
    sourceToken: undefined,
    destToken: undefined,
  })),
}));

const mockToken = {
  key: 'USDC',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  chain: 'Ethereum' as const,
  address: '0xa0b86a33e6180d4c6d1cbe6c9e1f4a3d4b8a6c6e',
  tokenId: {
    chain: 'Ethereum' as const,
    address: '0xa0b86a33e6180d4c6d1cbe6c9e1f4a3d4b8a6c6e',
  },
} as any;

const createMockStore = (amount?: any, route?: string) =>
  configureStore({
    reducer: {
      transferInput: () => ({
        amount,
        route,
      }),
    },
  });

const AppWrapper =
  (store: any) =>
  ({ children }: { children: React.ReactNode }) =>
    (
      <Provider store={store}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Provider>
    );

describe('FeeOffset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fee offset with token symbol when valid amount is calculated', async () => {
    const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
    const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));

    const feeOffset = sdkAmount.fromBaseUnits(1000n, 6); // 0.001 USDC
    calculateFeeOffset.mockReturnValue(feeOffset);
    useGetTokens.mockReturnValue({
      sourceToken: mockToken,
      destToken: undefined,
    } as any);

    const store = createMockStore(
      sdkAmount.fromBaseUnits(100000n, 6),
      'TestRoute',
    );

    render(<FeeOffset />, {
      wrapper: AppWrapper(store),
    });

    expect(screen.getByText('+0.001 USDC')).toBeInTheDocument();
  });

  it('displays info icon with tooltip', async () => {
    const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
    const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));

    const feeOffset = sdkAmount.fromBaseUnits(1000n, 6);
    calculateFeeOffset.mockReturnValue(feeOffset);
    useGetTokens.mockReturnValue({
      sourceToken: mockToken,
      destToken: undefined,
    } as any);

    const store = createMockStore(
      sdkAmount.fromBaseUnits(100000n, 6),
      'TestRoute',
    );

    render(<FeeOffset />, {
      wrapper: AppWrapper(store),
    });

    const infoIcon = screen.getByTestId('InfoOutlineIcon');
    expect(infoIcon).toBeInTheDocument();
  });
});
