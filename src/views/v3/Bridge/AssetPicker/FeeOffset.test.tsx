import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import FeeOffset from './FeeOffset';
import { dark } from 'theme';
import { createMockToken, TestConfigContext } from 'utils/testHelpers';

const theme = createTheme({
  palette: dark as any,
});

// Mock config object provided via TestConfigContext
const mockConfig = {
  ui: {
    experimental: {
      feeOffsetting: true,
    },
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

const mockToken = createMockToken({
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  chain: 'Ethereum',
  addressString: '0xa0b86a33e6180d4c6d1cbe6c9e1f4a3d4b8a6c6e',
});

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
      <TestConfigContext.Provider value={mockConfig}>
        <Provider store={store}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </Provider>
      </TestConfigContext.Provider>
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

  it('does not render when feeOffsetting is disabled in config', async () => {
    const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
    const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));

    const disabledConfig = {
      ui: {
        experimental: {
          feeOffsetting: false,
        },
      },
    };

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

    // Use wrapper with disabled feeOffsetting config
    const DisabledWrapper = ({ children }: { children: React.ReactNode }) => (
      <TestConfigContext.Provider value={disabledConfig}>
        <Provider store={store}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </Provider>
      </TestConfigContext.Provider>
    );

    render(<FeeOffset />, {
      wrapper: DisabledWrapper,
    });

    expect(screen.queryByText(/\+.*USDC/)).not.toBeInTheDocument();
  });

  it('does not render when feeOffsetAmount is undefined', async () => {
    const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
    const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));

    calculateFeeOffset.mockReturnValue(undefined);
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

    expect(screen.queryByText(/\+.*USDC/)).not.toBeInTheDocument();
  });

  it('does not render when feeOffsetAmount is zero', async () => {
    const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
    const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));

    const feeOffset = sdkAmount.fromBaseUnits(0n, 6); // Zero amount
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

    expect(screen.queryByText(/\+.*USDC/)).not.toBeInTheDocument();
  });
});
