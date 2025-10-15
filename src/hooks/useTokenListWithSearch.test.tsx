import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTokenListWithSearch } from './useTokenListWithSearch';
import { Token } from 'config/tokens';
import { amount } from '@wormhole-foundation/sdk-connect';

const ethereumUSDC = new Token({
  chain: 'Ethereum',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  symbol: 'USDC',
});

const arbitrumUSDC = new Token({
  chain: 'Arbitrum',
  address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  decimals: 6,
  symbol: 'USDC',
});

const arbitrumFrankensteinUSDC = new Token({
  chain: 'Arbitrum',
  address: '0xC96F2715E2a242d50D1b0bC923dbe1740b8eCf18',
  decimals: 6,
  symbol: 'USDC',
  tokenBridgeOriginalTokenId: ethereumUSDC.tokenId,
});

const mockGetOrFetchToken = vi.fn().mockResolvedValue(null);
const mockGetTokenPrices = vi.fn(() => new Map());

vi.mock('contexts/TokensContext', () => ({
  useTokens: () => ({
    getOrFetchToken: mockGetOrFetchToken,
    getTokenPrices: mockGetTokenPrices,
  }),
}));

describe('useTokenListWithSearch', () => {
  it('should filter out frankenstein tokens on destination chain', () => {
    const { result } = renderHook(() =>
      useTokenListWithSearch({
        baseTokenList: [arbitrumUSDC, arbitrumFrankensteinUSDC],
        searchQuery: '',
        chain: 'Arbitrum',
        isSource: false,
        isSameChainSwap: false,
        sourceToken: ethereumUSDC,
      }),
    );

    // Should only have the native USDC token, frankenstein USDC filtered out
    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].symbol).toBe('USDC');
    expect(result.current.sortedTokens[0].nativeChain).toBe('Arbitrum');
  });

  it('should filter out frankenstein tokens on source chain if no balance', () => {
    const { result } = renderHook(() =>
      useTokenListWithSearch({
        baseTokenList: [arbitrumUSDC, arbitrumFrankensteinUSDC],
        searchQuery: '',
        chain: 'Arbitrum',
        isSource: true,
        isSameChainSwap: false,
        sourceToken: undefined,
      }),
    );

    // Should only have the native USDC token, frankenstein USDC filtered out due to no balance
    expect(result.current.sortedTokens).toHaveLength(1);
    expect(result.current.sortedTokens[0].symbol).toBe('USDC');
    expect(result.current.sortedTokens[0].nativeChain).toBe('Arbitrum');
  });

  it('should include frankenstein tokens on source chain if has balance', () => {
    const { result } = renderHook(() =>
      useTokenListWithSearch({
        baseTokenList: [arbitrumUSDC, arbitrumFrankensteinUSDC],
        searchQuery: '',
        chain: 'Arbitrum',
        isSource: true,
        isSameChainSwap: false,
        sourceToken: undefined,
        balances: {
          [arbitrumFrankensteinUSDC.key]: {
            balance: amount.fromBaseUnits(1000000n, 6), // 1 token with 6 decimals
            lastUpdated: Date.now(),
          },
        },
      }),
    );

    // Should have both the native USDC token and frankenstein USDC since it has a balance
    expect(result.current.sortedTokens).toHaveLength(2);
    expect(result.current.sortedTokens[0].symbol).toBe('USDC');
    expect(result.current.sortedTokens[0].nativeChain).toBe('Arbitrum');
  });
});
