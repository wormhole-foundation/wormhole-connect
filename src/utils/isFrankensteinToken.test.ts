import { describe, it, expect } from 'vitest';
import { isFrankensteinToken } from './index';
import { Token } from 'config/tokens';

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
});
