import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import ChainList from './ChainList';
import { dark } from 'theme';

const theme = createTheme({
  palette: dark as any,
});

const mockChainConfigs = [
  {
    key: 'Ethereum',
    displayName: 'Ethereum',
    sdkName: 'Ethereum' as const,
    icon: 'Ethereum' as const,
    explorerUrl: 'https://etherscan.io',
    explorerName: 'Etherscan',
  },
  {
    key: 'Solana',
    displayName: 'Solana',
    sdkName: 'Solana' as const,
    icon: 'Solana' as const,
    explorerUrl: 'https://solscan.io',
    explorerName: 'Solscan',
  },
  {
    key: 'Arbitrum',
    displayName: 'Arbitrum',
    sdkName: 'Arbitrum' as const,
    icon: 'Arbitrum' as const,
    explorerUrl: 'https://arbiscan.io',
    explorerName: 'Arbiscan',
  },
];

const mockWallet = {
  type: 'Evm' as const,
  address: '0x123',
  currentAddress: '0x123',
  error: '',
  name: 'Test Wallet',
  sending: { address: '0x123' },
  receiving: { address: '0x456' },
};

const defaultProps = {
  chainList: mockChainConfigs,
  selectedChainConfig: undefined,
  showSearch: false,
  setShowSearch: vi.fn(),
  wallet: mockWallet,
  onChainSelect: vi.fn(),
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('ChainList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chain list with chain buttons', () => {
    render(<ChainList {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
    expect(screen.getByText('Arbitrum')).toBeInTheDocument();
  });

  it('calls onChainSelect when a chain button is clicked', () => {
    render(<ChainList {...defaultProps} />, { wrapper: AppWrapper });

    const ethereumButton = screen
      .getByText('Ethereum')
      .closest('div[role="button"]');
    fireEvent.click(ethereumButton!);

    expect(defaultProps.onChainSelect).toHaveBeenCalledWith('Ethereum');
  });

  it('shows search interface when showSearch is true', () => {
    const props = { ...defaultProps, showSearch: true };
    render(<ChainList {...props} />, { wrapper: AppWrapper });

    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });
});
