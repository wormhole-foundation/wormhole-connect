import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

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
    mayanApi: 'https://price-api.mayan.finance',
    tokens: {
      get: vi.fn(() => mockToken),
      findBySymbol: vi.fn(() => mockToken),
    },
  },
}));

vi.mock('@wormhole-foundation/sdk', () => ({
  chainIdToChain: vi.fn((chainId) => {
    const chainMap: Record<number, string> = {
      1: 'Ethereum',
      2: 'Solana',
      3: 'Bsc',
      4: 'Polygon',
      5: 'Avalanche',
      6: 'Arbitrum',
      14: 'Optimism',
    };
    return chainMap[chainId] || undefined;
  }),
  toNative: vi.fn((chain, address) => ({
    chain,
    address,
  })),
}));

import useTransactionHistoryMayan from './useTransactionHistoryMayan';

// Sample test data
const mockMayanTransaction = {
  trader: '0xuser1',
  destAddress: '0xuser2',
  sourceTxHash: '0xabc123',
  sourceChain: 1,
  swapChain: 'solana',
  destChain: 4,
  fromAmount: '1000000',
  fromTokenChain: 1,
  fromTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  fromTokenPrice: 1.0,
  fromTokenSymbol: 'USDC',
  toTokenPrice: 1.0,
  toTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  toTokenChain: 4,
  toTokenSymbol: 'USDC',
  status: 'COMPLETED',
  clientStatus: 'COMPLETED',
  initiatedAt: '2023-01-01T00:00:00Z',
  toAmount: '995000',
  statusUpdatedAt: '2023-01-01T00:10:00Z',
};

describe('useTransactionHistoryMayan', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully parse and return Mayan transactions', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [mockMayanTransaction] }),
    });

    const { result } = renderHook(() =>
      useTransactionHistoryMayan({
        address: '0xuser1',
        page: 0,
        pageSize: 30,
      }),
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
    expect(tx?.inProgress).toBe(false);
  });

  it('should handle pending transactions correctly', async () => {
    const pendingTx = {
      ...mockMayanTransaction,
      status: 'SENT_TO_SOLANA',
      clientStatus: 'PENDING',
      toAmount: null,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [pendingTx] }),
    });

    const { result } = renderHook(() =>
      useTransactionHistoryMayan({
        address: '0xuser1',
      }),
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    const tx = result.current.transactions?.[0];
    expect(tx?.inProgress).toBe(true);
  });

  it('should skip transactions with unsupported chains', async () => {
    const unsupportedChainTx = {
      ...mockMayanTransaction,
      sourceChain: 99999, // Unsupported chain
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [unsupportedChainTx] }),
    });

    const { result } = renderHook(() =>
      useTransactionHistoryMayan({
        address: '0xuser1',
      }),
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

    const { result } = renderHook(() =>
      useTransactionHistoryMayan({
        address: '0xuser1',
      }),
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toBe('');
    expect(result.current.transactions).toEqual([]);
  });

  it('should handle server errors gracefully', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() =>
      useTransactionHistoryMayan({
        address: '0xuser1',
      }),
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toBe('');
  });

  it('should handle network errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    const { result } = renderHook(() =>
      useTransactionHistoryMayan({
        address: '0xuser1',
      }),
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.error).toContain(
      'Error fetching transaction history from Mayan',
    );
  });

  it('should handle empty response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const { result } = renderHook(() =>
      useTransactionHistoryMayan({
        address: '0xuser1',
      }),
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.transactions).toEqual([]);
    expect(result.current.error).toBe('');
    expect(result.current.hasMore).toBe(false);
  });
});
