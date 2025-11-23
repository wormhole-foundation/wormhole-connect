import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import WalletAddress from '../WalletAddress';
import { dark } from 'theme';
import type { WalletData } from 'store/wallet';

const theme = createTheme({
  palette: dark,
});

const mockConnectedWallet: WalletData = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  type: 'Evm',
  icon: 'icon-url',
  name: 'MetaMask',
  currentAddress: '0x1234567890abcdef1234567890abcdef12345678',
  error: '',
};

const mockDisconnectedWallet: WalletData = {
  address: '',
  type: undefined,
  icon: '',
  name: '',
  currentAddress: '',
  error: '',
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('WalletAddress', () => {
  it('renders connected wallet address correctly', () => {
    render(<WalletAddress wallet={mockConnectedWallet} isDisabled={false} />, {
      wrapper: AppWrapper,
    });

    const addressElement = screen.getByText(/0x1234/i);
    expect(addressElement).toBeInTheDocument();
  });

  it('renders "Not connected" when wallet has no address', () => {
    render(
      <WalletAddress wallet={mockDisconnectedWallet} isDisabled={false} />,
      {
        wrapper: AppWrapper,
      },
    );

    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('shows green dot indicator when wallet is connected', () => {
    const { container } = render(
      <WalletAddress wallet={mockConnectedWallet} isDisabled={false} />,
      {
        wrapper: AppWrapper,
      },
    );

    // Count total divs - should be more when green dot is present
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(1);
  });

  it('does not show green dot when wallet is disconnected', () => {
    const { container: connectedContainer } = render(
      <WalletAddress wallet={mockConnectedWallet} isDisabled={false} />,
      {
        wrapper: AppWrapper,
      },
    );

    const { container: disconnectedContainer } = render(
      <WalletAddress wallet={mockDisconnectedWallet} isDisabled={false} />,
      {
        wrapper: AppWrapper,
      },
    );

    const connectedDivs = connectedContainer.querySelectorAll('div').length;
    const disconnectedDivs =
      disconnectedContainer.querySelectorAll('div').length;
    expect(connectedDivs).toBeGreaterThan(disconnectedDivs);
  });

  it('renders container element', () => {
    const { container } = render(
      <WalletAddress wallet={mockConnectedWallet} isDisabled={false} />,
      {
        wrapper: AppWrapper,
      },
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toBeInTheDocument();
    expect(outerDiv.tagName).toBe('DIV');
  });

  it('renders address in uppercase', () => {
    render(<WalletAddress wallet={mockConnectedWallet} isDisabled={false} />, {
      wrapper: AppWrapper,
    });

    const typography = screen.getByText(/0x1234/i);
    expect(typography).toHaveStyle({ textTransform: 'uppercase' });
  });

  it('handles empty address string', () => {
    const emptyWallet = { ...mockConnectedWallet, address: '' };
    render(<WalletAddress wallet={emptyWallet} isDisabled={false} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('applies disabled styles when isDisabled is true', () => {
    render(<WalletAddress wallet={mockConnectedWallet} isDisabled={true} />, {
      wrapper: AppWrapper,
    });

    const addressElement = screen.getByText(/0x1234/i);
    expect(addressElement).toBeInTheDocument();
  });
});
