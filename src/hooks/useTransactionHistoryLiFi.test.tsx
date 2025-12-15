import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import {
  createMockToken,
  createTestWrapper,
  TestConfigContext,
} from 'utils/testHelpers';

const mockToken = createMockToken({
  chain: 'Ethereum',
  addressString: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
});

// Mock config object provided via TestConfigContext
const mockConfig = {
  lifiExplorerUrl: 'https://li.quest',
  tokens: {
    get: vi.fn(() => mockToken),
    findBySymbol: vi.fn(() => mockToken),
  },
};

// Mock useConfig to read from TestConfigContext instead of ConfigContext
vi.mock('contexts/ConfigContext', () => ({
  useConfig: () => {
    const context = React.useContext(TestConfigContext);
    if (!context) {
      throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
  },
}));

vi.mock('routes/lifi/utils', () => ({
  lifiChainIdToChain: vi.fn((chainId) => {
    const chainMap: Record<number, string> = {
      1: 'Ethereum',
      56: 'Bsc',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
    };
    return chainMap[chainId];
  }),
}));

vi.mock('@wormhole-foundation/sdk', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@wormhole-foundation/sdk')
  >();
  return {
    ...actual,
    amount: {
      ...actual.amount,
      fromBaseUnits: vi.fn((amt, decimals) => ({
        amount: amt.toString(),
        decimals,
      })),
      display: vi.fn((amountObj) => {
        if (!amountObj) return undefined;
        const divisor = BigInt(10 ** amountObj.decimals);
        const value = BigInt(amountObj.amount) / divisor;
        return value.toString();
      }),
    },
  };
});

import useTransactionHistoryLiFi from './useTransactionHistoryLiFi';

// Create wrapper with TestConfigContext providing our mock config
const wrapper = createTestWrapper({ config: mockConfig });

// Sample test data
const mockLiFiTransaction = {
  transactionId: 'test-tx-id',
  integrator: 'test-integrator',
  status: 'DONE' as const,
  substatus: 'completed',
  timestamp: '1234567890',
  sending: {
    txHash: '0xabc123',
    txLink: 'https://etherscan.io/tx/0xabc123',
    amount: '1000000',
    token: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      priceUSD: '1.0',
    },
    chainId: 1,
    gasPrice: '20000000000',
    gasUsed: '100000',
    gasToken: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
    },
    gasAmountUSD: '5.00',
    amountUSD: '1000.00',
    value: '0',
    timestamp: '1234567890',
  },
  receiving: {
    txHash: '0xdef456',
    txLink: 'https://polygonscan.com/tx/0xdef456',
    amount: '995000',
    token: {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      chainId: 137,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      priceUSD: '1.0',
    },
    chainId: 137,
    gasPrice: '30000000000',
    gasUsed: '80000',
    gasToken: {
      address: '0x0000000000000000000000000000001010',
      chainId: 137,
      symbol: 'MATIC',
      decimals: 18,
      name: 'Polygon',
    },
    gasAmountUSD: '2.00',
    amountUSD: '995.00',
    value: '0',
    timestamp: '1234567900',
  },
  fromAddress: '0xuser1',
  toAddress: '0xuser2',
  tool: 'test-tool',
  bridge: 'test-bridge',
};

describe('useTransactionHistoryLiFi', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully parse and return LiFi transactions', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ transfers: [mockLiFiTransaction] }),
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryLiFi({
          address: '0xuser1',
          page: 0,
          pageSize: 30,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(1);
    const tx = result.current.transactions?.[0];

    expect(tx?.txHash).toBe('0xabc123');
    expect(tx?.sender).toBe('0xuser1');
    expect(tx?.recipient).toBe('0xuser2');
    expect(tx?.fromChain).toBe('Ethereum');
    expect(tx?.toChain).toBe('Polygon');
    expect(tx?.explorerLink).toBe('https://scan.li.fi/tx/0xabc123');
    expect(tx?.inProgress).toBe(false);
  });

  it('should skip pending transactions without receiving data', async () => {
    const pendingTx = {
      ...mockLiFiTransaction,
      status: 'PENDING' as const,
      receiving: undefined,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ transfers: [pendingTx] }),
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryLiFi({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // Pending transactions without receiving data should be skipped
    expect(result.current.transactions).toHaveLength(0);
  });

  it('should skip transactions with unsupported chains', async () => {
    const unsupportedChainTx = {
      ...mockLiFiTransaction,
      sending: {
        ...mockLiFiTransaction.sending,
        chainId: 99999, // Unsupported chain
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ transfers: [unsupportedChainTx] }),
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryLiFi({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('should handle rate limiting with user-friendly message', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryLiFi({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load LiFi transactions.');
    expect(result.current.transactions).toEqual([]);
  });

  it('should handle server errors gracefully', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryLiFi({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load LiFi transactions.');
  });

  it('should handle network errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    const { result } = renderHook(
      () =>
        useTransactionHistoryLiFi({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load LiFi transactions.');
  });

  it('should handle empty response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ transfers: [] }),
    });

    const { result } = renderHook(
      () =>
        useTransactionHistoryLiFi({
          address: '0xuser1',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.transactions).toEqual([]);
    expect(result.current.error).toBe('Failed to load LiFi transactions.');
    expect(result.current.hasMore).toBe(false);
  });
});
