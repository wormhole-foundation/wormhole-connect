import { describe, it, expect, vi } from 'vitest';
import { isFrankensteinToken } from './index';
import { Token } from 'config/tokens';
import type * as wrappedNativeTokens from './wrappedNativeTokens';

vi.mock('./wrappedNativeTokens', async () => {
  const actual = await vi.importActual<typeof wrappedNativeTokens>(
    './wrappedNativeTokens',
  );
  return {
    ...actual,
    getWrappedNativeToken: vi.fn((network, chain) => {
      // TODO: remove this when added to SDK
      if (chain === 'Monad') {
        return '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A';
      }
      return actual.getWrappedNativeToken(network, chain);
    }),
  };
});

describe('isFrankensteinToken', () => {
  it('should return false for non-wrapped tokens', () => {
    const ethereumUSDC = new Token({
      chain: 'Ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC',
      tokenBridgeOriginalTokenId: undefined,
    });

    expect(isFrankensteinToken(ethereumUSDC, 'Ethereum')).toBe(false);
  });

  it('should return true for Arbitrum wrapped USDC on Solana', () => {
    const arbitrumUSDC = new Token({
      chain: 'Arbitrum',
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      decimals: 6,
      symbol: 'USDC',
    });

    const wrappedOnSolana = new Token({
      chain: 'Solana',
      address: '8wJakbZuv7WApfHmRo2sdkeQfu6hXqfEqjb7BYXDKpKe',
      decimals: 6,
      symbol: 'USDC',
      tokenBridgeOriginalTokenId: arbitrumUSDC.tokenId,
    });

    expect(isFrankensteinToken(wrappedOnSolana, 'Solana')).toBe(true);
  });

  it('should return false for wrapped WETH on Solana', () => {
    const ethereumWETH = new Token({
      chain: 'Ethereum',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      symbol: 'WETH',
    });

    const wrappedOnSolana = new Token({
      chain: 'Solana',
      address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
      decimals: 8,
      symbol: 'WETH',
      tokenBridgeOriginalTokenId: ethereumWETH.tokenId,
    });

    expect(isFrankensteinToken(wrappedOnSolana, 'Solana')).toBe(false);
  });

  describe('Monad source chain with Ethereum originalToken', () => {
    it('should return true when originalToken is Sepolia native gas token', () => {
      const ethereumETH = new Token({
        chain: 'Ethereum',
        address: 'native',
        decimals: 18,
        symbol: 'ETH',
      });

      const wrappedOnMonad = new Token({
        chain: 'Monad',
        address: '0x1234567890123456789012345678901234567890',
        decimals: 18,
        symbol: 'ETH',
        tokenBridgeOriginalTokenId: ethereumETH.tokenId,
      });

      expect(isFrankensteinToken(wrappedOnMonad, 'Monad')).toBe(true);
    });

    it('should return true when originalToken is Sepolia wrapped gas token (WETH)', () => {
      const ethereumWETH = new Token({
        chain: 'Ethereum',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        symbol: 'WETH',
      });

      const wrappedOnMonad = new Token({
        chain: 'Monad',
        address: '0x2345678901234567890123456789012345678901',
        decimals: 18,
        symbol: 'WETH',
        tokenBridgeOriginalTokenId: ethereumWETH.tokenId,
      });

      expect(isFrankensteinToken(wrappedOnMonad, 'Monad')).toBe(true);
    });
  });

  describe('Ethereum source chain with Monad originalToken', () => {
    it('should return true when originalToken is Monad native gas token', () => {
      const monadETH = new Token({
        chain: 'Monad',
        address: 'native',
        decimals: 18,
        symbol: 'MON',
      });

      const wrappedOnEthereum = new Token({
        chain: 'Ethereum',
        address: '0x4567890123456789012345678901234567890123',
        decimals: 18,
        symbol: 'WMON',
        tokenBridgeOriginalTokenId: monadETH.tokenId,
      });

      expect(isFrankensteinToken(wrappedOnEthereum, 'Ethereum')).toBe(true);
    });

    it('should return true when originalToken is Monad wrapped gas token (WMON)', () => {
      const monadWETH = new Token({
        chain: 'Monad',
        address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
        decimals: 18,
        symbol: 'WMON',
      });

      const wrappedOnEthereum = new Token({
        chain: 'Ethereum',
        address: '0x4567890123456789012345678901234567890123',
        decimals: 18,
        symbol: 'WMON',
        tokenBridgeOriginalTokenId: monadWETH.tokenId,
      });

      expect(isFrankensteinToken(wrappedOnEthereum, 'Ethereum')).toBe(true);
    });
  });
});
