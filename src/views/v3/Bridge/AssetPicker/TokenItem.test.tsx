import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import TokenItem from './TokenItem';
import { dark } from 'theme';
import { createMockToken } from 'utils/testHelpers';

const theme = createTheme({
  palette: dark,
});

vi.mock('utils', () => ({
  chainDisplayName: vi.fn((chain) => chain),
  getTokenExplorerUrl: vi.fn(() => 'https://explorer.example.com'),
  getTokenDisplaySymbolByTokenAddress: vi.fn(() => 'USDC'),
}));

vi.mock('components/TokenBalance', () => ({
  default: ({ balance }: { balance: any }) => (
    <div data-testid="token-balance">{balance ? '1,000' : '0'}</div>
  ),
}));

const mockToken = createMockToken({
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  addressString: '0xa0b86a33e6180d4c6d1cbe6c9e1f4a3d4b8a6c6e',
  chain: 'Ethereum',
});

const mockBalance = {
  amount: '1000000000', // 1000 USDC
  decimals: 6,
};

const defaultProps = {
  token: mockToken,
  chain: 'Ethereum' as const,
  balance: mockBalance,
  price: '1.00',
  onClick: vi.fn(),
  isSelected: false,
  isFetchingBalance: false,
  isSource: true,
  isDimmed: false,
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('TokenItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders token information correctly', () => {
    render(<TokenItem {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getAllByText('USDC')).toHaveLength(2); // Symbol appears twice in UI
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when token item is clicked', () => {
    render(<TokenItem {...defaultProps} />, { wrapper: AppWrapper });

    const tokenButton = screen.getByRole('button');
    fireEvent.mouseDown(tokenButton);

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('displays balance when provided', () => {
    render(<TokenItem {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getByTestId('token-balance')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('shows loading state when fetching balance', () => {
    const props = { ...defaultProps, isFetchingBalance: true };
    render(<TokenItem {...props} />, { wrapper: AppWrapper });

    expect(screen.getByTestId('token-balance')).toBeInTheDocument();
  });

  it('displays "0" when balance is null', () => {
    const props = { ...defaultProps, balance: null };
    render(<TokenItem {...props} />, { wrapper: AppWrapper });

    expect(screen.getByTestId('token-balance')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows external link for explorer URL', () => {
    render(<TokenItem {...defaultProps} />, { wrapper: AppWrapper });

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://explorer.example.com');
  });
});
