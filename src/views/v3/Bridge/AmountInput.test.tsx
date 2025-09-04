import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material';
import { configureStore } from '@reduxjs/toolkit';

import { useGetTokens } from 'hooks/useGetTokens';
import AmountInput from './AmountInput';
import { dark } from 'theme';

const theme = createTheme({
  palette: dark as any,
});

// Mock useGetTokens hook
vi.mock('hooks/useGetTokens', () => ({
  useGetTokens: vi.fn(() => ({
    sourceToken: { symbol: 'USDC', decimals: 6 },
    destToken: { symbol: 'USDC', decimals: 6 },
  })),
}));

const mockStore = configureStore({
  reducer: {
    transferInput: (
      state = {
        fromChain: 'Ethereum',
        isTransactionInProgress: false,
      },
    ) => state,
  },
});

const defaultProps = {
  value: '',
  debouncedValue: '',
  supportedSourceTokens: [],
  tokenBalance: null,
  receiveAmount: undefined,
  error: undefined,
  warning: undefined,
  onChange: vi.fn(),
  onDebouncedChange: vi.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </Provider>
);

describe('AmountInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and displays the provided value', () => {
    const props = { ...defaultProps, value: '100', debouncedValue: '100' };
    render(<AmountInput {...props} />, { wrapper });
    const input = screen.getByRole('textbox', { name: 'Amount input' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('100');
  });

  it('calls onChange when input value changes', () => {
    render(<AmountInput {...defaultProps} />, { wrapper });
    const input = screen.getByRole('textbox', { name: 'Amount input' });
    fireEvent.change(input, { target: { value: '123' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('123');
  });

  it('disables input when no source chain is selected', () => {
    const storeWithNoChain = configureStore({
      reducer: {
        transferInput: () => ({
          fromChain: undefined,
          isTransactionInProgress: false,
        }),
      },
    });

    const wrapperWithNoChain = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <Provider store={storeWithNoChain}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Provider>
    );

    render(<AmountInput {...defaultProps} />, {
      wrapper: wrapperWithNoChain,
    });
    const input = screen.getByRole('textbox', { name: 'Amount input' });
    expect(input).toBeDisabled();
  });

  it('disables input when no source token is selected', () => {
    // Mock useGetTokens to return undefined for sourceToken
    vi.mocked(useGetTokens).mockReturnValueOnce({
      sourceToken: undefined,
      destToken: { symbol: 'USDC', decimals: 6 },
    } as any);

    render(<AmountInput {...defaultProps} />, { wrapper });
    const input = screen.getByRole('textbox', { name: 'Amount input' });
    expect(input).toBeDisabled();
  });

  it('disables input when transaction is in progress', () => {
    const storeWithTxInProgress = configureStore({
      reducer: {
        transferInput: () => ({
          fromChain: 'Ethereum',
          isTransactionInProgress: true,
        }),
      },
    });

    const wrapperWithTxInProgress = ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <Provider store={storeWithTxInProgress}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Provider>
    );

    render(<AmountInput {...defaultProps} />, {
      wrapper: wrapperWithTxInProgress,
    });
    const input = screen.getByRole('textbox', { name: 'Amount input' });
    expect(input).toBeDisabled();
  });

  it('rejects invalid input (non-numeric characters)', () => {
    render(<AmountInput {...defaultProps} />, { wrapper });
    const input = screen.getByRole('textbox', { name: 'Amount input' });

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('formats large numbers with commas', async () => {
    const props = {
      ...defaultProps,
      value: '1000000',
      debouncedValue: '1000000',
    };
    render(<AmountInput {...props} />, { wrapper });
    const input = screen.getByRole('textbox', { name: 'Amount input' });
    await waitFor(() => {
      expect(input).toHaveValue('1,000,000');
    });
  });
});
