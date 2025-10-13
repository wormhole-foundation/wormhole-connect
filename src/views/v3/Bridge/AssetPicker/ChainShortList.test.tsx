import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import '@testing-library/jest-dom/vitest';

import ChainShortList from './ChainShortList';
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
  {
    key: 'Base',
    displayName: 'Base',
    sdkName: 'Base' as const,
    icon: 'Base' as const,
    explorerUrl: 'https://basescan.org',
    explorerName: 'Basescan',
  },
  {
    key: 'Bsc',
    displayName: 'BNB Chain',
    sdkName: 'Bsc' as const,
    icon: 'Bsc' as const,
    explorerUrl: 'https://bscscan.com',
    explorerName: 'BscScan',
  },
  {
    key: 'Polygon',
    displayName: 'Polygon',
    sdkName: 'Polygon' as const,
    icon: 'Polygon' as const,
    explorerUrl: 'https://polygonscan.com',
    explorerName: 'PolygonScan',
  },
  {
    key: 'Avalanche',
    displayName: 'Avalanche',
    sdkName: 'Avalanche' as const,
    icon: 'Avalanche' as const,
    explorerUrl: 'https://snowtrace.io',
    explorerName: 'Snowtrace',
  },
  {
    key: 'Fantom',
    displayName: 'Fantom',
    sdkName: 'Fantom' as const,
    icon: 'Fantom' as const,
    explorerUrl: 'https://ftmscan.com',
    explorerName: 'FTMScan',
  },
  {
    key: 'Sui',
    displayName: 'Sui',
    sdkName: 'Sui' as const,
    icon: 'Sui' as const,
    explorerUrl: 'https://suiexplorer.com',
    explorerName: 'Sui Explorer',
  },
];

const mockSelectedChain = {
  key: 'Ethereum',
  displayName: 'Ethereum',
  sdkName: 'Ethereum' as const,
  icon: 'Ethereum' as const,
  explorerUrl: 'https://etherscan.io',
  explorerName: 'Etherscan',
};

const defaultProps = {
  chains: mockChainConfigs,
  selectedChain: undefined,
  showMoreButton: false,
  onChainSelect: vi.fn(),
  onShowMore: vi.fn(),
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('ChainShortList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chain buttons in two rows', () => {
    render(<ChainShortList {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
    expect(screen.getByText('Arbitrum')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('BNB Chain')).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
    expect(screen.getByText('Avalanche')).toBeInTheDocument();
    expect(screen.getByText('Fantom')).toBeInTheDocument();
    expect(screen.getByText('Sui')).toBeInTheDocument();
  });

  it('calls onChainSelect when a chain button is clicked', () => {
    render(<ChainShortList {...defaultProps} />, { wrapper: AppWrapper });

    const ethereumButton = screen.getByTestId('chain-button-ethereum');
    fireEvent.click(ethereumButton);

    expect(defaultProps.onChainSelect).toHaveBeenCalledWith('Ethereum');
  });

  it('shows selected chain with proper styling', () => {
    const props = { ...defaultProps, selectedChain: mockSelectedChain };
    render(<ChainShortList {...props} />, { wrapper: AppWrapper });

    const ethereumButton = screen.getByTestId('chain-button-ethereum');
    expect(ethereumButton).toHaveClass('Mui-selected');
  });

  it('shows More button when showMoreButton is true', () => {
    const props = { ...defaultProps, showMoreButton: true };
    render(<ChainShortList {...props} />, { wrapper: AppWrapper });

    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('does not show More button when showMoreButton is false', () => {
    render(<ChainShortList {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.queryByText('More')).not.toBeInTheDocument();
  });

  it('calls onShowMore when More button is clicked', () => {
    const props = { ...defaultProps, showMoreButton: true };
    render(<ChainShortList {...props} />, { wrapper: AppWrapper });

    const moreButton = screen.getByRole('button', { name: /More/ });
    fireEvent.click(moreButton);

    expect(defaultProps.onShowMore).toHaveBeenCalledTimes(1);
  });

  it('distributes chains across two rows correctly', () => {
    const twoChains = mockChainConfigs.slice(0, 2);
    const props = { ...defaultProps, chains: twoChains };
    render(<ChainShortList {...props} />, { wrapper: AppWrapper });

    // With 2 chains, first row should have 1 chain, second row should have 1 chain
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
  });

  it('distributes 9 chains across two rows correctly (5 in first row, 4 in second)', () => {
    render(<ChainShortList {...defaultProps} />, { wrapper: AppWrapper });

    // With 9 chains: Math.ceil(9/2) = 5 chains in first row, 4 chains in second row
    // First row should have: Ethereum, Solana, Arbitrum, Base, BNB Chain
    // Second row should have: Polygon, Avalanche, Fantom, Sui

    // All chains should be rendered
    expect(screen.getAllByRole('button')).toHaveLength(9);

    // Verify all chain names are present
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument(); // Should be in second row
    expect(screen.getByText('Sui')).toBeInTheDocument(); // Should be last in second row
  });
});
