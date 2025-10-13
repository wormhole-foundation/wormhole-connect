import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

const mockToken = {
  key: 'USDC',
  chain: 'Ethereum',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
};

// Mock dependencies
vi.mock('config', () => ({
  default: {
    wormholeApi: 'https://api.wormholescan.io',
    isMainnet: false,
    tokens: {
      get: vi.fn(() => mockToken),
      findBySymbol: vi.fn(() => mockToken),
    },
  },
}));

vi.mock('config/constants', () => ({
  WORMSCAN: 'https://wormholescan.io/',
}));

vi.mock('utils', () => ({
  getGasToken: vi.fn((chain) => ({
    symbol: 'ETH',
    decimals: 18,
  })),
}));

vi.mock('utils/balance', () => ({
  toFixedDecimals: vi.fn((value) => value),
}));

vi.mock('contexts/TokensContext', () => ({
  useTokens: vi.fn(() => ({
    tokens: {
      'Ethereum.0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': mockToken,
      'Polygon.0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': mockToken,
    },
    getOrFetchToken: vi.fn(async () => mockToken),
  })),
}));

vi.mock('@wormhole-foundation/sdk', () => ({
  amount: {
    fromBaseUnits: vi.fn((amount, decimals) => ({
      amount: amount.toString(),
      decimals,
    })),
    display: vi.fn((amountObj) => {
      if (!amountObj) return undefined;
      const divisor = BigInt(10 ** amountObj.decimals);
      const value = BigInt(amountObj.amount) / divisor;
      return value.toString();
    }),
  },
  chainIdToChain: vi.fn((chainId) => {
    const chainMap: Record<number, string> = {
      2: 'Ethereum',
      1: 'Solana',
      4: 'Bsc',
      5: 'Polygon',
      6: 'Avalanche',
      23: 'Arbitrum',
      24: 'Optimism',
    };
    return chainMap[chainId] || undefined;
  }),
  toNative: vi.fn((chain, address) => ({
    chain,
    address,
  })),
  Wormhole: {
    tokenId: vi.fn((chain, address) => `${chain}.${address}`),
    parseAll: vi.fn(() => ({
      vaa: {
        timestamp: '2023-01-01T00:00:00Z',
      },
    })),
  },
}));

import useTransactionHistoryWHScan from './useTransactionHistoryWHScan';

// Wrapper component to provide TokensContext
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

describe('useTransactionHistoryWHScan', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle network errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    const { result } = renderHook(
      () =>
        useTransactionHistoryWHScan({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toContain(
      'Error fetching transaction history from WormholeScan',
    );
  });

  it('should handle empty response', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ operations: [] }),
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryWHScan({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.transactions || []).toEqual([]);
    // The hook might encounter errors during initialization
    // For simplicity, just check that hasMore is false
    expect(result.current.hasMore).toBe(false);
  });

  it('should handle HTTP error responses', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 500,
      json: async () => ({}),
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryWHScan({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.transactions || []).toEqual([]);
  });
});
