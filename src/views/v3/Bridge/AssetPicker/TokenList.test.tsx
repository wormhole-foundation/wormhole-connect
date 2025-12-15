import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

import TokenList from './TokenList';
import { dark } from 'theme';
import { TestConfigContext } from 'utils/testHelpers';

const theme = createTheme({
  palette: dark as any,
});

// Mock config object provided via TestConfigContext
const mockConfig = {
  tokens: {},
  ui: {
    disableUserInputtedTokens: false,
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

// Mock SearchableList to simplify testing
vi.mock('views/v3/Bridge/AssetPicker/SearchableList', () => ({
  default: ({ searchQuery, onQueryChange }: any) => (
    <div>
      <input
        placeholder="Search tokens"
        value={searchQuery}
        onChange={(e) => onQueryChange?.(e.target.value)}
      />
      <div>Mocked SearchableList</div>
    </div>
  ),
}));

vi.mock('hooks/useTokenListWithSearch', () => ({
  useTokenListWithSearch: vi.fn(() => ({
    sortedTokens: [],
    tokenPrices: {},
  })),
}));

vi.mock('hooks/useTokenListGrouping', () => ({
  useTokenListGrouping: vi.fn(() => ({
    groupedTokens: [],
  })),
}));

const mockChainConfig = {
  key: 'Ethereum',
  displayName: 'Ethereum',
  sdkName: 'Ethereum' as const,
  icon: 'Ethereum' as const,
  explorerUrl: 'https://etherscan.io',
  explorerName: 'Etherscan',
};

const mockWallet = {
  type: 'Evm' as const,
  address: '0x123',
  currentAddress: '0x123',
  error: '',
  name: 'Test Wallet',
};

const defaultProps = {
  tokenList: [],
  balances: {},
  isFetchingBalances: false,
  isFetching: false,
  isConnectingWallet: false,
  selectedChainConfig: mockChainConfig,
  selectedToken: undefined,
  sourceToken: undefined,
  isSameChainSwap: false,
  isSource: true,
  wallet: mockWallet,
  searchQuery: '',
  onSearchQueryChange: vi.fn(),
  onSelectToken: vi.fn(),
  fetchTokensProgress: null,
};

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <TestConfigContext.Provider value={mockConfig}>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </TestConfigContext.Provider>
);

describe('TokenList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders token list with search input', () => {
    render(<TokenList {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getByPlaceholderText('Search tokens')).toBeInTheDocument();
  });

  it('renders mocked searchable list', () => {
    render(<TokenList {...defaultProps} />, { wrapper: AppWrapper });

    expect(screen.getByText('Mocked SearchableList')).toBeInTheDocument();
  });

  it('calls onSearchQueryChange when search input changes', () => {
    render(<TokenList {...defaultProps} />, { wrapper: AppWrapper });

    const searchInput = screen.getByPlaceholderText('Search tokens');
    fireEvent.change(searchInput, { target: { value: 'USDC' } });

    expect(defaultProps.onSearchQueryChange).toHaveBeenCalledWith('USDC');
  });
});
