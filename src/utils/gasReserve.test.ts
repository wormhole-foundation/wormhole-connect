import { describe, it, expect } from 'vitest';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { getGasReserve } from './gasReserve';

describe('getGasReserve', () => {
  describe('Ethereum mainnet', () => {
    it('returns 0.01 ETH for Ethereum', () => {
      const reserve = getGasReserve('Ethereum');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n); // 0.01 * 10^18
    });
  });

  describe('L2 chains', () => {
    it('returns 0.001 ETH for Base', () => {
      const reserve = getGasReserve('Base');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n); // 0.001 * 10^18
    });

    it('returns 0.001 ETH for Optimism', () => {
      const reserve = getGasReserve('Optimism');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n);
    });

    it('returns 0.001 ETH for Arbitrum', () => {
      const reserve = getGasReserve('Arbitrum');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n);
    });

    it('returns 0.001 for Scroll', () => {
      const reserve = getGasReserve('Scroll');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n);
    });

    it('returns 0.001 for Xlayer', () => {
      const reserve = getGasReserve('Xlayer');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n);
    });

    it('returns 0.001 for Mantle', () => {
      const reserve = getGasReserve('Mantle');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.001');
      expect(sdkAmount.units(reserve!)).toBe(1000000000000000n);
    });
  });

  describe('Solana', () => {
    it('returns 0.01 SOL for Solana', () => {
      const reserve = getGasReserve('Solana');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000n); // 0.01 * 10^9
    });
  });

  describe('Other EVM L1 chains', () => {
    it('returns 0.01 for Bsc', () => {
      const reserve = getGasReserve('Bsc');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Avalanche', () => {
      const reserve = getGasReserve('Avalanche');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Polygon', () => {
      const reserve = getGasReserve('Polygon');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns undefined for Fantom (gas token not configured)', () => {
      const reserve = getGasReserve('Fantom');

      // Fantom has a reserve configured but no gas token in config, so should return undefined
      expect(reserve).toBeUndefined();
    });

    it('returns 0.01 for Celo', () => {
      const reserve = getGasReserve('Celo');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Moonbeam', () => {
      const reserve = getGasReserve('Moonbeam');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Monad', () => {
      const reserve = getGasReserve('Monad');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Klaytn', () => {
      const reserve = getGasReserve('Klaytn');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });

    it('returns 0.01 for Fogo', () => {
      const reserve = getGasReserve('Fogo');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000n); // 0.01 * 10^9
    });

    it('returns 0.01 for XRPLEVM', () => {
      const reserve = getGasReserve('XRPLEVM');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000000000000n);
    });
  });

  describe('Move chains', () => {
    it('returns 0.01 for Sui', () => {
      const reserve = getGasReserve('Sui');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(10000000n); // 0.01 * 10^9
    });

    it('returns 0.01 for Aptos', () => {
      const reserve = getGasReserve('Aptos');

      expect(reserve).toBeDefined();
      expect(sdkAmount.display(reserve!)).toBe('0.01');
      expect(sdkAmount.units(reserve!)).toBe(1000000n); // 0.01 * 10^8
    });
  });

  describe('Chains without configured reserves', () => {
    it('returns undefined for Cosmoshub', () => {
      const reserve = getGasReserve('Cosmoshub');

      expect(reserve).toBeUndefined();
    });

    it('returns undefined for Wormchain', () => {
      const reserve = getGasReserve('Wormchain');

      expect(reserve).toBeUndefined();
    });

    it('returns undefined for Osmosis', () => {
      const reserve = getGasReserve('Osmosis');

      expect(reserve).toBeUndefined();
    });
  });
});
