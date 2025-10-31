import { describe, it, expect, vi, beforeEach } from 'vitest';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import {
  calculateFeeOffset,
  roundDownToDecimals,
  applyOffsetFormula,
} from './fees';
import config from 'config';
import { createMockToken } from './testHelpers';

// Mock the config module
vi.mock('config', () => ({
  default: {
    routes: {
      get: vi.fn(),
    },
  },
}));

describe('calculateFeeOffset', () => {
  const mockAmount = sdkAmount.fromBaseUnits(10000n, 6); // 0.01 with 6 decimals
  const mockToken = createMockToken({
    addressString: '0xa0b86a33e6776a1e5e0b3a6f6a1b6d6f7e7c7e8e',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  }) as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined for invalid inputs', () => {
    // Mock a valid route for testing
    const mockRoute = {
      rc: {
        meta: { name: 'TestRoute' },
        config: {
          referrerFeeDbps: 10n,
        },
      },
    };
    vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

    // Test with undefined route
    expect(
      calculateFeeOffset(undefined as any, mockAmount, mockToken),
    ).toBeUndefined();

    // Test with undefined amount
    expect(
      calculateFeeOffset('TestRoute', undefined, mockToken),
    ).toBeUndefined();

    // Test with zero amount
    expect(
      calculateFeeOffset(
        'TestRoute',
        sdkAmount.fromBaseUnits(0n, 6),
        mockToken,
      ),
    ).toBeUndefined();
  });

  it('should return undefined when route is not found', () => {
    vi.mocked(config.routes.get).mockReturnValue(undefined as any);

    const result = calculateFeeOffset(
      'NonExistentRoute',
      mockAmount,
      mockToken,
    );
    expect(result).toBeUndefined();
  });

  describe('Mayan routes', () => {
    it('should calculate fee using getReferrerBps for Mayan routes', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'MayanSwapRoute' },
          getReferrerBps: vi.fn().mockReturnValue(100), // 100 bps = 1%
        },
      };

      const mockDestToken = {
        ...mockToken,
        chain: 'Solana',
        tokenId: {
          chain: 'Solana',
          address: mockToken.address,
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'MayanSwapRoute',
        mockAmount,
        mockToken,
        mockDestToken,
      );

      expect(mockRoute.rc.getReferrerBps).toHaveBeenCalledWith({
        source: {
          id: mockToken.tokenId,
          symbol: mockToken.symbol,
          decimals: mockToken.decimals,
        },
        destination: {
          id: mockDestToken.tokenId,
          symbol: mockDestToken.symbol,
          decimals: mockDestToken.decimals,
        },
      });

      // offset = 10000 * 100 / (10000 - 100) = 101.01... ≈ 101
      expect(sdkAmount.units(result!)).toBe(101n);
    });

    it('should return undefined for Mayan routes with zero bps', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'MayanSwapRoute' },
          getReferrerBps: vi.fn().mockReturnValue(0),
        },
      };

      const mockDestToken = {
        ...mockToken,
        chain: 'Solana',
        tokenId: {
          chain: 'Solana',
          address: mockToken.address,
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'MayanSwapRoute',
        mockAmount,
        mockToken,
        mockDestToken,
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined for Mayan routes without getReferrerBps', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'MayanSwapRoute' },
        },
      };

      const mockDestToken = {
        ...mockToken,
        chain: 'Solana',
        tokenId: {
          chain: 'Solana',
          address: mockToken.address,
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'MayanSwapRoute',
        mockAmount,
        mockToken,
        mockDestToken,
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined for Mayan routes without destination token', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'MayanSwapRoute' },
          getReferrerBps: vi.fn().mockReturnValue(100),
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'MayanSwapRoute',
        mockAmount,
        mockToken,
      );
      expect(result).toBeUndefined();
      expect(mockRoute.rc.getReferrerBps).not.toHaveBeenCalled();
    });
  });

  describe('CCTP Executor routes', () => {
    it('should calculate fee using referrerFeeDbps', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'CCTPExecutorRoute' },
          config: {
            referrerFeeDbps: 10n, // 10 dbps = 0.01%
          },
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'CCTPExecutorRoute',
        mockAmount,
        mockToken,
      );

      // offset = 10000 * 10 / (100000 - 10) = 1.001... ≈ 1
      expect(sdkAmount.units(result!)).toBe(1n);
    });
  });

  describe('NTT Executor routes', () => {
    it('should calculate fee using referrerFee.feeDbps', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'NTTExecutorRoute' },
          config: {
            referrerFee: {
              feeDbps: 50n, // 50 dbps = 0.05%
            },
          },
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'NTTExecutorRoute',
        mockAmount,
        mockToken,
      );

      // offset = 10000 * 50 / (100000 - 50) = 5.002... ≈ 5
      expect(sdkAmount.units(result!)).toBe(5n);
    });

    it('should use token-specific override for NTT routes', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'NTTExecutorRoute' },
          config: {
            referrerFee: {
              feeDbps: 50n,
              perTokenOverrides: {
                [mockToken.addressString]: {
                  referrerFeeDbps: 20n, // Token-specific override
                },
              },
            },
          },
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'NTTExecutorRoute',
        mockAmount,
        mockToken,
      );

      // offset = 10000 * 20 / (100000 - 20) = 2.0004... ≈ 2
      expect(sdkAmount.units(result!)).toBe(2n);
    });
  });

  describe('Token Bridge Executor routes', () => {
    it('should calculate fee using referrerFee.referrerFeeDbps', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'TokenBridgeExecutorRoute' },
          config: {
            referrerFee: {
              referrerFeeDbps: 100n, // 100 dbps = 0.1%
            },
          },
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'TokenBridgeExecutorRoute',
        mockAmount,
        mockToken,
      );

      // offset = 10000 * 100 / (100000 - 100) = 10.001... ≈ 10
      expect(sdkAmount.units(result!)).toBe(10n);
    });

    it('should use token-specific override for Token Bridge Executor routes', () => {
      const mockRoute = {
        rc: {
          meta: { name: 'TokenBridgeExecutorRoute' },
          config: {
            referrerFee: {
              referrerFeeDbps: 100n,
              tokenFeeOverrides: {
                [mockToken.addressString]: {
                  referrerFeeDbps: 30n, // Token-specific override
                },
              },
            },
          },
        },
      };

      vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

      const result = calculateFeeOffset(
        'TokenBridgeExecutorRoute',
        mockAmount,
        mockToken,
      );

      // offset = 10000 * 30 / (100000 - 30) = 3.0009... ≈ 3
      expect(sdkAmount.units(result!)).toBe(3n);
    });
  });

  it('should return undefined for routes without config', () => {
    const mockRoute = {
      rc: {
        meta: { name: 'SomeRoute' },
      },
    };

    vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

    const result = calculateFeeOffset('SomeRoute', mockAmount, mockToken);
    expect(result).toBeUndefined();
  });

  it('should return undefined for routes with zero fee', () => {
    const mockRoute = {
      rc: {
        meta: { name: 'ZeroFeeRoute' },
        config: {
          referrerFeeDbps: 0n,
        },
      },
    };

    vi.mocked(config.routes.get).mockReturnValue(mockRoute as any);

    const result = calculateFeeOffset('ZeroFeeRoute', mockAmount, mockToken);
    expect(result).toBeUndefined();
  });
});

describe('applyOffsetFormula', () => {
  const mockAmount = sdkAmount.fromBaseUnits(10000n, 6); // 0.01 with 6 decimals

  it('should calculate correct offset for dbps', () => {
    // 10 dbps = 0.01% fee on 0.01 tokens (10000 base units with 6 decimals)
    // offset = 10000 * 10 / (100000 - 10) = 10000 * 10 / 99990 = 1.001... ≈ 1
    const result = applyOffsetFormula(mockAmount, 10n, 100000n);
    expect(sdkAmount.units(result)).toBe(1n);
    expect(result.decimals).toBe(6);
  });

  it('should work with different fee rates', () => {
    // Test various fee rates to ensure formula works correctly

    // 1 bps = 0.01% fee
    const result1bps = applyOffsetFormula(mockAmount, 1n, 10000n);
    expect(sdkAmount.units(result1bps)).toBe(1n); // Very small offset

    // 500 bps = 5% fee
    const result500bps = applyOffsetFormula(mockAmount, 500n, 10000n);
    // offset = 10000 * 500 / (10000 - 500) = 10000 * 500 / 9500 = 526.31... ≈ 526
    expect(sdkAmount.units(result500bps)).toBe(526n);

    // 1000 dbps = 1% fee (same as 100 bps but using dbps denominator)
    const result1000dbps = applyOffsetFormula(mockAmount, 1000n, 100000n);
    // offset = 10000 * 1000 / (100000 - 1000) = 10000 * 1000 / 99000 = 101.01... ≈ 101
    expect(sdkAmount.units(result1000dbps)).toBe(101n);
  });

  it('should handle edge case with very small fee rates', () => {
    // 1 dbps = 0.001% fee - very small
    const result = applyOffsetFormula(mockAmount, 1n, 100000n);
    // offset = 10000 * 1 / (100000 - 1) = 10000 / 99999 = 0.10000... which gets truncated to 0
    expect(sdkAmount.units(result)).toBe(0n);
  });

  it('should handle edge case with larger amounts', () => {
    // Test with a larger amount: 1000 tokens (1000000000 base units with 6 decimals)
    const largeAmount = sdkAmount.fromBaseUnits(1000000000n, 6);

    // 100 bps = 1% fee
    const result = applyOffsetFormula(largeAmount, 100n, 10000n);
    // offset = 1000000000 * 100 / (10000 - 100) = 1000000000 * 100 / 9900 = 10101010.1... ≈ 10101010
    expect(sdkAmount.units(result)).toBe(10101010n);
    expect(result.decimals).toBe(6);
  });

  it('should work with zero fee rate', () => {
    // Edge case: 0 fee rate should return 0 offset
    const result = applyOffsetFormula(mockAmount, 0n, 10000n);
    expect(sdkAmount.units(result)).toBe(0n);
    expect(result.decimals).toBe(6);
  });

  it('should demonstrate mathematical correctness', () => {
    // Verify the mathematical formula works as intended
    const amount = sdkAmount.fromBaseUnits(100000n, 6); // 0.1 tokens
    const feeRate = 250n; // 250 bps = 2.5%
    const denominator = 10000n;

    const offset = applyOffsetFormula(amount, feeRate, denominator);
    const totalSent = sdkAmount.units(amount) + sdkAmount.units(offset);

    // Calculate what the fee would be on the total sent amount
    const calculatedFee = (totalSent * feeRate) / denominator;
    const userReceives = totalSent - calculatedFee;

    // User should receive very close to the original amount (within rounding precision)
    expect(userReceives).toBeGreaterThanOrEqual(sdkAmount.units(amount));
    expect(userReceives - sdkAmount.units(amount)).toBeLessThanOrEqual(10n); // Allow small rounding difference
  });
});

describe('roundDownToDecimals', () => {
  it('should not round when token has maxDecimals or fewer', () => {
    // 6 decimals - no rounding
    expect(roundDownToDecimals(123456n, 6)).toBe(123456n);

    // 4 decimals - no rounding
    expect(roundDownToDecimals(1234n, 4)).toBe(1234n);

    // 0 decimals - no rounding
    expect(roundDownToDecimals(100n, 0)).toBe(100n);
  });

  it('should round down when token has more than maxDecimals', () => {
    // 18 decimals, needs rounding down
    // 1.234567890123456789 -> 1.234567
    const value18 = 1234567890123456789n;
    const expected18 = 1234567000000000000n;
    expect(roundDownToDecimals(value18, 18)).toBe(expected18);

    // 8 decimals, needs rounding down
    // 1.23456789 -> 1.234567
    const value8 = 123456789n;
    const expected8 = 123456700n;
    expect(roundDownToDecimals(value8, 8)).toBe(expected8);
  });

  it('should not round when value is already at maxDecimals precision', () => {
    // 18 decimals but value only uses 6 decimal places
    const value = 1234560000000000000n;
    expect(roundDownToDecimals(value, 18)).toBe(value);

    // 10 decimals but value only uses 6 decimal places
    const value10 = 12345600000n;
    expect(roundDownToDecimals(value10, 10)).toBe(value10);
  });

  it('should handle edge cases correctly', () => {
    // Zero value
    expect(roundDownToDecimals(0n, 18)).toBe(0n);

    // Very small value that rounds down to zero
    const tiny = 1n; // 0.000000000000000001 in 18 decimals
    const expectedTiny = 0n; // Rounds down to 0
    expect(roundDownToDecimals(tiny, 18)).toBe(expectedTiny);

    // Value just below 6 decimal precision
    const almostRounded = 1234567999999999999n; // Just below 1.234568
    const almostExpected = 1234567000000000000n; // Rounds down to 1.234567
    expect(roundDownToDecimals(almostRounded, 18)).toBe(almostExpected);
  });
});
