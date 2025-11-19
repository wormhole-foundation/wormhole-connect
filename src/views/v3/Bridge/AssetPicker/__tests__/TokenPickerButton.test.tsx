import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import TokenPickerButton from '../TokenPickerButton';
import { dark } from 'theme';
import { createMockToken } from 'utils/testHelpers';

const theme = createTheme({
  palette: dark,
});

vi.mock('utils', () => ({
  getTokenDisplaySymbolByTokenAddress: vi.fn(() => 'USDC'),
}));

vi.mock('config', () => ({
  default: {
    ui: {
      disableSourceAssetSelector: false,
      disableDestinationAssetSelector: false,
    },
  },
}));

vi.mock('components/AssetBadge', () => ({
  default: () => <div data-testid="asset-badge">AssetBadge</div>,
}));

vi.mock('./TokenPickerButtonContent', () => ({
  default: ({ symbol }: any) => <div>{symbol || 'Select'}</div>,
}));

const mockToken = createMockToken({
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  addressString: '0xa0b86a33e6180d4c6d1cbe6c9e1f4a3d4b8a6c6e',
  chain: 'Ethereum',
});

const mockChainConfig = {
  key: 'Ethereum',
  name: 'Ethereum',
  context: 'mainnet',
  chains: {},
  network: {
    name: 'Ethereum',
    chainId: 1,
  },
};

const mockTriggerProps = {
  onClick: vi.fn(),
  onMouseDown: vi.fn(),
  onTouchStart: vi.fn(),
};

const defaultProps = {
  chainConfig: mockChainConfig as any,
  dataTestId: 'token-picker-button',
  isSource: true,
  isTransactionInProgress: false,
  openDrawer: vi.fn(),
  token: mockToken,
  triggerProps: mockTriggerProps,
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('TokenPickerButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with token correctly', () => {
    render(<TokenPickerButton {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getByTestId('token-picker-button')).toBeInTheDocument();
    expect(screen.getByTestId('asset-badge')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('renders without token (select state)', () => {
    const props = { ...defaultProps, token: undefined };
    render(<TokenPickerButton {...props} />, { wrapper: AppWrapper });

    expect(screen.getByTestId('token-picker-button')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('is clickable when enabled and not in transaction', () => {
    render(<TokenPickerButton {...defaultProps} />, { wrapper: AppWrapper });

    const button = screen.getByTestId('token-picker-button');
    expect(button).toHaveAttribute('role', 'button');
    expect(button).toHaveAttribute('aria-label', 'Select source asset');
  });

  it('shows correct aria-label for destination asset', () => {
    const props = { ...defaultProps, isSource: false };
    render(<TokenPickerButton {...props} />, { wrapper: AppWrapper });

    const button = screen.getByTestId('token-picker-button');
    expect(button).toHaveAttribute('aria-label', 'Select destination asset');
  });

  it('is not interactable when transaction is in progress', () => {
    const props = { ...defaultProps, isTransactionInProgress: true };
    render(<TokenPickerButton {...props} />, { wrapper: AppWrapper });

    const button = screen.getByTestId('token-picker-button');
    expect(button).not.toHaveAttribute('role');
    expect(button).not.toHaveAttribute('aria-label');
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('calls triggerProps.onClick when clicked on desktop', () => {
    render(<TokenPickerButton {...defaultProps} />, {
      wrapper: AppWrapper,
    });

    const button = screen.getByTestId('token-picker-button');
    fireEvent.click(button);

    expect(mockTriggerProps.onClick).toHaveBeenCalled();
  });

  it('renders memoized component correctly', () => {
    const { rerender } = render(<TokenPickerButton {...defaultProps} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByTestId('token-picker-button')).toBeInTheDocument();

    // Re-render with same props
    rerender(
      <ThemeProvider theme={theme}>
        <TokenPickerButton {...defaultProps} />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('token-picker-button')).toBeInTheDocument();
  });

  it('handles missing chainConfig gracefully', () => {
    const props = { ...defaultProps, chainConfig: undefined };
    render(<TokenPickerButton {...props} />, { wrapper: AppWrapper });

    expect(screen.getByTestId('token-picker-button')).toBeInTheDocument();
    expect(screen.getByTestId('asset-badge')).toBeInTheDocument();
  });
});
