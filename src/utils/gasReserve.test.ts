import { describe, it, expect } from 'vitest';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { getGasReserve } from './gasReserve';

describe('getGasReserve', () => {
  describe('Ethereum mainnet', () => {
    it('returns 0.01 ETH for Ethereum with 18 decimals', () => {
      const reserve = getGasReserve('Ethereum', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n); // 0.01 * 10^18
    });
  });

  describe('L2 chains', () => {
    it('returns 0.001 ETH for Base with 18 decimals', () => {
      const reserve = getGasReserve('Base', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n); // 0.001 * 10^18
    });

    it('returns 0.001 ETH for Optimism with 18 decimals', () => {
      const reserve = getGasReserve('Optimism', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n);
    });

    it('returns 0.001 ETH for Arbitrum with 18 decimals', () => {
      const reserve = getGasReserve('Arbitrum', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n);
    });
  });

  describe('Solana', () => {
    it('returns 0.01 SOL for Solana with 9 decimals', () => {
      const reserve = getGasReserve('Solana', 9);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000n); // 0.01 * 10^9
    });
  });

  describe('Other EVM L1 chains', () => {
    it('returns 0.01 for Bsc with 18 decimals', () => {
      const reserve = getGasReserve('Bsc', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Avalanche with 18 decimals', () => {
      const reserve = getGasReserve('Avalanche', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Polygon with 18 decimals', () => {
      const reserve = getGasReserve('Polygon', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Fantom with 18 decimals', () => {
      const reserve = getGasReserve('Fantom', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Celo with 18 decimals', () => {
      const reserve = getGasReserve('Celo', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Moonbeam with 18 decimals', () => {
      const reserve = getGasReserve('Moonbeam', 18);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });
  });

  describe('Move chains', () => {
    it('returns 0.01 for Sui with 9 decimals', () => {
      const reserve = getGasReserve('Sui', 9);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000n); // 0.01 * 10^9
    });

    it('returns 0.01 for Aptos with 8 decimals', () => {
      const reserve = getGasReserve('Aptos', 8);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(1000000n); // 0.01 * 10^8
    });
  });

  describe('Chains without configured reserves', () => {
    it('returns undefined for Cosmoshub', () => {
      const reserve = getGasReserve('Cosmoshub', 6);

      expect(reserve).toBeUndefined();
    });

    it('returns undefined for Wormchain', () => {
      const reserve = getGasReserve('Wormchain', 6);

      expect(reserve).toBeUndefined();
    });

    it('returns undefined for Osmosis', () => {
      const reserve = getGasReserve('Osmosis', 6);

      expect(reserve).toBeUndefined();
    });
  });

  describe('Decimal precision', () => {
    it('correctly handles different decimal precision for same reserve value', () => {
      const reserve18 = getGasReserve('Ethereum', 18);
      const reserve6 = getGasReserve('Ethereum', 6);

      // Both should display as 0.01, but have different base units
      expect(sdkAmount.display(reserve18!)).toBe('0.01');
      expect(sdkAmount.display(reserve6!)).toBe('0.01');

      // Base units should differ by 10^12
      expect(sdkAmount.units(reserve18!)).toBe(10000000000000000n); // 0.01 * 10^18
      expect(sdkAmount.units(reserve6!)).toBe(10000n); // 0.01 * 10^6
    });

    it('handles 8-decimal precision (Aptos)', () => {
      const reserve = getGasReserve('Aptos', 8);

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(1000000n); // 0.01 * 10^8
    });

    it('handles 9-decimal precision (Solana, Sui)', () => {
      const reserveSolana = getGasReserve('Solana', 9);
      const reserveSui = getGasReserve('Sui', 9);

      expect(reserveSolana).toBeDefined();
      expect(reserveSui).toBeDefined();
      expect(sdkAmount.display(reserveSolana!)).toBe('0.01');
      expect(sdkAmount.display(reserveSui!)).toBe('0.01');
      expect(sdkAmount.units(reserveSolana!)).toBe(10000000n); // 0.01 * 10^9
      expect(sdkAmount.units(reserveSui!)).toBe(10000000n);
    });
  });
});
