import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import PercentButtons from './PercentButtons';
import { dark } from 'theme';
import { createMockToken } from 'utils/testHelpers';

const theme = createTheme({
  palette: dark as any,
});

// Mock the hooks and utilities
vi.mock('hooks/useGetTokens', () => ({
  useGetTokens: vi.fn(() => ({
    sourceToken: undefined,
    destToken: undefined,
  })),
}));

vi.mock('utils/fees', () => ({
  calculateFeeOffset: vi.fn(),
}));

vi.mock('utils/gasReserve', () => ({
  getGasReserve: vi.fn(),
}));

vi.mock('utils', () => ({
  getGasToken: vi.fn(),
  getTokenDisplaySymbolByTokenAddress: vi.fn((token) => token.symbol),
}));

vi.mock('@wormhole-foundation/sdk', async () => {
  const actual = await vi.importActual('@wormhole-foundation/sdk');
  return {
    ...actual,
    isSameToken: vi.fn(),
  };
});

vi.mock('config', () => ({
  default: {
    routes: {
      get: vi.fn(),
    },
  },
}));

const mockToken = createMockToken({
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  chain: 'Ethereum',
  addressString: '0x0000000000000000000000000000000000000000',
});

const createMockStore = (route?: string) =>
  configureStore({
    reducer: {
      transferInput: () => ({
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

describe('PercentButtons', () => {
  const mockOnAmountChange = vi.fn();
  const mockOnDebouncedAmountChange = vi.fn();
  const mockOnPercentSelect = vi.fn();

  const defaultProps = {
    tokenBalance: sdkAmount.fromBaseUnits(1000000000000000000n, 18), // 1 ETH
    chain: 'Ethereum' as const,
    isTransactionInProgress: false,
    selectedPercent: 0,
    onAmountChange: mockOnAmountChange,
    onDebouncedAmountChange: mockOnDebouncedAmountChange,
    onPercentSelect: mockOnPercentSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders 25%, 50%, and Max buttons', () => {
      const store = createMockStore();

      render(<PercentButtons {...defaultProps} />, {
        wrapper: AppWrapper(store),
      });

      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
    });
  });

  describe('Basic percentage calculation', () => {
    it('calculates 25% of balance when clicking 25% button', async () => {
      const store = createMockStore();

      render(<PercentButtons {...defaultProps} />, {
        wrapper: AppWrapper(store),
      });

      const button25 = screen.getByText('25%');
      fireEvent.click(button25);

      expect(mockOnAmountChange).toHaveBeenCalledWith('0.25');
      expect(mockOnDebouncedAmountChange).toHaveBeenCalledWith('0.25');
      expect(mockOnPercentSelect).toHaveBeenCalledWith(25);
    });

    it('calculates 50% of balance when clicking 50% button', () => {
      const store = createMockStore();

      render(<PercentButtons {...defaultProps} />, {
        wrapper: AppWrapper(store),
      });

      const button50 = screen.getByText('50%');
      fireEvent.click(button50);

      expect(mockOnAmountChange).toHaveBeenCalledWith('0.5');
      expect(mockOnDebouncedAmountChange).toHaveBeenCalledWith('0.5');
      expect(mockOnPercentSelect).toHaveBeenCalledWith(50);
    });

    it('calculates 100% of balance when clicking Max button without offsets', async () => {
      const store = createMockStore();
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));

      calculateFeeOffset.mockReturnValue(undefined);
      getGasReserve.mockReturnValue(undefined);

      render(<PercentButtons {...defaultProps} />, {
        wrapper: AppWrapper(store),
      });

      const buttonMax = screen.getByText('Max');
      fireEvent.click(buttonMax);

      expect(mockOnAmountChange).toHaveBeenCalledWith('1');
      expect(mockOnDebouncedAmountChange).toHaveBeenCalledWith('1');
      expect(mockOnPercentSelect).toHaveBeenCalledWith(100);
    });
  });

  describe('Fee offset subtraction', () => {
    it('subtracts fee offset from Max amount when route has fees', async () => {
      const store = createMockStore('MayanRoute');
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));

      const feeOffset = sdkAmount.fromBaseUnits(10000000000000000n, 18); // 0.01 ETH
      calculateFeeOffset.mockReturnValue(feeOffset);
      getGasReserve.mockReturnValue(undefined);
      useGetTokens.mockReturnValue({
        sourceToken: mockToken,
        destToken: mockToken,
      } as any);

      render(<PercentButtons {...defaultProps} />, {
        wrapper: AppWrapper(store),
      });

      const buttonMax = screen.getByText('Max');
      fireEvent.click(buttonMax);

      // 1 ETH - 0.01 ETH fee = 0.99 ETH
      expect(mockOnAmountChange).toHaveBeenCalledWith('0.99');
      expect(mockOnDebouncedAmountChange).toHaveBeenCalledWith('0.99');
    });
  });

  describe('Gas reserve subtraction', () => {
    it('subtracts gas reserve from Max amount for gas tokens', async () => {
      const store = createMockStore();
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));
      const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));
      const { getGasToken } = vi.mocked(await import('utils'));
      const { isSameToken } = vi.mocked(
        await import('@wormhole-foundation/sdk'),
      );

      const gasReserve = sdkAmount.fromBaseUnits(10000000000000000n, 18); // 0.01 ETH
      calculateFeeOffset.mockReturnValue(undefined);
      getGasReserve.mockReturnValue(gasReserve);
      getGasToken.mockReturnValue(mockToken);
      isSameToken.mockReturnValue(true);
      useGetTokens.mockReturnValue({
        sourceToken: mockToken,
        destToken: undefined,
      } as any);

      render(<PercentButtons {...defaultProps} />, {
        wrapper: AppWrapper(store),
      });

      const buttonMax = screen.getByText('Max');
      fireEvent.click(buttonMax);

      // 1 ETH - 0.01 ETH gas reserve = 0.99 ETH
      expect(mockOnAmountChange).toHaveBeenCalledWith('0.99');
      expect(mockOnDebouncedAmountChange).toHaveBeenCalledWith('0.99');
    });

    it('does not subtract gas reserve for non-gas tokens', async () => {
      const store = createMockStore();
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));
      const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));
      const { getGasToken } = vi.mocked(await import('utils'));
      const { isSameToken } = vi.mocked(
        await import('@wormhole-foundation/sdk'),
      );

      const usdcToken = createMockToken({
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'Ethereum',
        addressString: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      });

      calculateFeeOffset.mockReturnValue(undefined);
      getGasReserve.mockReturnValue(sdkAmount.fromBaseUnits(10000n, 6)); // 0.01 USDC
      getGasToken.mockReturnValue(mockToken); // ETH
      isSameToken.mockReturnValue(false); // USDC !== ETH
      useGetTokens.mockReturnValue({
        sourceToken: usdcToken,
        destToken: undefined,
      } as any);

      const propsWithUSDC = {
        ...defaultProps,
        tokenBalance: sdkAmount.fromBaseUnits(1000000n, 6), // 1 USDC
      };

      render(<PercentButtons {...propsWithUSDC} />, {
        wrapper: AppWrapper(store),
      });

      const buttonMax = screen.getByText('Max');
      fireEvent.click(buttonMax);

      // Full balance, no gas reserve deducted
      expect(mockOnAmountChange).toHaveBeenCalledWith('1');
      expect(mockOnDebouncedAmountChange).toHaveBeenCalledWith('1');
    });
  });

  describe('Insufficient balance handling', () => {
    it('shows tooltip on click when balance is less than or equal to gas reserve', async () => {
      const store = createMockStore();
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));
      const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));
      const { getGasToken } = vi.mocked(await import('utils'));
      const { isSameToken } = vi.mocked(
        await import('@wormhole-foundation/sdk'),
      );

      const gasReserve = sdkAmount.fromBaseUnits(20000000000000000n, 18); // 0.02 ETH
      calculateFeeOffset.mockReturnValue(undefined);
      getGasReserve.mockReturnValue(gasReserve);
      getGasToken.mockReturnValue(mockToken);
      isSameToken.mockReturnValue(true);
      useGetTokens.mockReturnValue({
        sourceToken: mockToken,
        destToken: undefined,
      } as any);

      const propsWithLowBalance = {
        ...defaultProps,
        tokenBalance: sdkAmount.fromBaseUnits(10000000000000000n, 18), // 0.01 ETH (less than 0.02 reserve)
      };

      render(<PercentButtons {...propsWithLowBalance} />, {
        wrapper: AppWrapper(store),
      });

      const buttonMax = screen.getByText('Max').closest('button');

      // Max button should NOT be disabled
      expect(buttonMax).not.toBeDisabled();

      // Click the button
      fireEvent.click(buttonMax!);

      // Should NOT call amount change handlers when insufficient balance
      expect(mockOnAmountChange).not.toHaveBeenCalled();
      expect(mockOnDebouncedAmountChange).not.toHaveBeenCalled();
      expect(mockOnPercentSelect).not.toHaveBeenCalled();

      // Should show error tooltip (check for visible tooltip content)
      expect(
        screen.getByRole('tooltip', {
          name: /You don't have enough funds in your wallet to cover both this amount and the gas cost of the transfer/i,
        }),
      ).toBeInTheDocument();
    });

    it('shows tooltip only for the specific button clicked', async () => {
      const store = createMockStore();
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));
      const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));
      const { getGasToken } = vi.mocked(await import('utils'));
      const { isSameToken } = vi.mocked(
        await import('@wormhole-foundation/sdk'),
      );

      const gasReserve = sdkAmount.fromBaseUnits(20000000000000000n, 18); // 0.02 ETH
      calculateFeeOffset.mockReturnValue(undefined);
      getGasReserve.mockReturnValue(gasReserve);
      getGasToken.mockReturnValue(mockToken);
      isSameToken.mockReturnValue(true);
      useGetTokens.mockReturnValue({
        sourceToken: mockToken,
        destToken: undefined,
      } as any);

      const propsWithLowBalance = {
        ...defaultProps,
        tokenBalance: sdkAmount.fromBaseUnits(10000000000000000n, 18), // 0.01 ETH (less than 0.02 reserve)
      };

      render(<PercentButtons {...propsWithLowBalance} />, {
        wrapper: AppWrapper(store),
      });

      const button50 = screen.getByText('50%').closest('button');

      // Click the 50% button
      fireEvent.click(button50!);

      // Only the 50% button should have the error tooltip (check for visible tooltip with role="tooltip")
      const tooltips = screen.queryAllByRole('tooltip', {
        name: /You don't have enough funds in your wallet to cover both this amount and the gas cost of the transfer/i,
      });
      expect(tooltips).toHaveLength(1);
    });

    it('does not show error tooltip for non-gas tokens with insufficient balance', async () => {
      const store = createMockStore();
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));
      const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));
      const { getGasToken } = vi.mocked(await import('utils'));
      const { isSameToken } = vi.mocked(
        await import('@wormhole-foundation/sdk'),
      );

      const usdcToken = createMockToken({
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chain: 'Ethereum',
        addressString: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      });

      const gasReserve = sdkAmount.fromBaseUnits(20000000000000000n, 18); // 0.02 ETH
      calculateFeeOffset.mockReturnValue(undefined);
      getGasReserve.mockReturnValue(gasReserve);
      getGasToken.mockReturnValue(mockToken); // ETH
      isSameToken.mockReturnValue(false); // USDC !== ETH
      useGetTokens.mockReturnValue({
        sourceToken: usdcToken,
        destToken: undefined,
      } as any);

      const propsWithLowBalance = {
        ...defaultProps,
        tokenBalance: sdkAmount.fromBaseUnits(1000n, 6), // 0.001 USDC (very low balance)
      };

      render(<PercentButtons {...propsWithLowBalance} />, {
        wrapper: AppWrapper(store),
      });

      const buttonMax = screen.getByText('Max').closest('button');

      // Click the button
      fireEvent.click(buttonMax!);

      // Should call amount change handlers (no error tooltip for non-gas tokens)
      expect(mockOnAmountChange).toHaveBeenCalled();
      expect(mockOnDebouncedAmountChange).toHaveBeenCalled();
      expect(mockOnPercentSelect).toHaveBeenCalled();

      // Should NOT show error tooltip
      expect(
        screen.queryByRole('tooltip', {
          name: /You don't have enough funds in your wallet to cover both this amount and the gas cost of the transfer/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Combined offsets', () => {
    it('subtracts both fee offset and gas reserve from Max amount', async () => {
      const store = createMockStore('MayanRoute');
      const { calculateFeeOffset } = vi.mocked(await import('utils/fees'));
      const { getGasReserve } = vi.mocked(await import('utils/gasReserve'));
      const { useGetTokens } = vi.mocked(await import('hooks/useGetTokens'));
      const { getGasToken } = vi.mocked(await import('utils'));
      const { isSameToken } = vi.mocked(
        await import('@wormhole-foundation/sdk'),
      );

      const feeOffset = sdkAmount.fromBaseUnits(5000000000000000n, 18); // 0.005 ETH
      const gasReserve = sdkAmount.fromBaseUnits(10000000000000000n, 18); // 0.01 ETH
      calculateFeeOffset.mockReturnValue(feeOffset);
      getGasReserve.mockReturnValue(gasReserve);
      getGasToken.mockReturnValue(mockToken);
      isSameToken.mockReturnValue(true);
      useGetTokens.mockReturnValue({
        sourceToken: mockToken,
        destToken: mockToken,
      } as any);

      render(<PercentButtons {...defaultProps} />, {
        wrapper: AppWrapper(store),
      });

      const buttonMax = screen.getByText('Max');
      fireEvent.click(buttonMax);

      // 1 ETH - 0.005 ETH fee - 0.01 ETH gas = 0.985 ETH
      expect(mockOnAmountChange).toHaveBeenCalledWith('0.985');
      expect(mockOnDebouncedAmountChange).toHaveBeenCalledWith('0.985');
    });
  });

  describe('Button states', () => {
    it('disables all buttons when transaction is in progress', () => {
      const store = createMockStore();
      const propsWithInProgress = {
        ...defaultProps,
        isTransactionInProgress: true,
      };

      render(<PercentButtons {...propsWithInProgress} />, {
        wrapper: AppWrapper(store),
      });

      const button25 = screen.getByText('25%');
      const button50 = screen.getByText('50%');
      const buttonMax = screen.getByText('Max');

      expect(button25.closest('button')).toBeDisabled();
      expect(button50.closest('button')).toBeDisabled();
      expect(buttonMax.closest('button')).toBeDisabled();
    });

    it('applies selected styles to the selected button', () => {
      const store = createMockStore();
      const propsWithSelected = {
        ...defaultProps,
        selectedPercent: 50,
      };

      render(<PercentButtons {...propsWithSelected} />, {
        wrapper: AppWrapper(store),
      });

      const button50 = screen.getByText('50%').closest('button');

      // Selected button should have the primary background color
      expect(button50).toHaveStyle({
        backgroundColor: theme.palette.primary.main,
      });
    });
  });
});
