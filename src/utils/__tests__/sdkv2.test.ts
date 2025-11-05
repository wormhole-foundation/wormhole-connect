import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFilteredChains } from '../sdkv2';
import type { Chain } from '@wormhole-foundation/sdk';
import config from 'config';

// Mock the dependencies
vi.mock('config', () => ({
  default: {
    chainsArr: [
      { sdkName: 'Ethereum' },
      { sdkName: 'Solana' },
      { sdkName: 'Polygon' },
      { sdkName: 'Avalanche' },
      { sdkName: 'Bsc' },
      { sdkName: 'Arbitrum' },
      { sdkName: 'Optimism' },
      { sdkName: 'Base' },
      { sdkName: 'HyperCore' }, // Mock HyperCore chain
    ],
    routes: {
      isSameChainSwapSupported: vi.fn(),
    },
    network: 'Mainnet',
    isChainSupportedHandler: undefined,
  },
}));

describe('getFilteredChains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.isChainSupportedHandler = undefined;
  });

  describe('basic filtering', () => {
    it('should return only chains that are in supportedChains', () => {
      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(3);
      expect(result.map((c) => c.sdkName)).toEqual([
        'Ethereum',
        'Solana',
        'Polygon',
      ]);
    });

    it('should filter out chains not in supportedChains', () => {
      const supportedChains: Array<Chain> = ['Ethereum', 'Solana'];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.sdkName)).not.toContain('Polygon');
    });

    it('should handle empty supportedChains', () => {
      const supportedChains: Array<Chain> = [];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(0);
    });
  });

  describe('chainToOmit filtering', () => {
    it('should omit a specific chain when same chain swap is not supported', () => {
      vi.mocked(config.routes.isSameChainSwapSupported).mockReturnValue(false);
      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, 'Ethereum', false);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.sdkName)).toEqual(['Solana', 'Polygon']);
      expect(config.routes.isSameChainSwapSupported).toHaveBeenCalledWith(
        'Ethereum',
      );
    });

    it('should include the chainToOmit when same chain swap is supported', () => {
      vi.mocked(config.routes.isSameChainSwapSupported).mockReturnValue(true);
      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, 'Ethereum', false);

      expect(result).toHaveLength(3);
      expect(result.map((c) => c.sdkName)).toContain('Ethereum');
      expect(config.routes.isSameChainSwapSupported).toHaveBeenCalledWith(
        'Ethereum',
      );
    });

    it('should not call isSameChainSwapSupported when chainToOmit is undefined', () => {
      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(3);
      expect(config.routes.isSameChainSwapSupported).not.toHaveBeenCalled();
    });
  });

  describe('isSource filtering (HyperCore chains)', () => {
    it('should filter out HyperCore chains when isSource is true', () => {
      const supportedChains: Array<Chain> = [
        'Ethereum',
        'Solana',
        'HyperCore', // HyperCore chain
      ];
      const result = getFilteredChains(supportedChains, undefined, true);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.sdkName)).toEqual(['Ethereum', 'Solana']);
      expect(result.map((c) => c.sdkName)).not.toContain('HyperCore');
    });

    it('should include HyperCore chains when isSource is false', () => {
      const supportedChains: Array<Chain> = [
        'Ethereum',
        'Solana',
        'HyperCore', // HyperCore chain
      ];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(3);
      expect(result.map((c) => c.sdkName)).toContain('HyperCore');
    });

    it('should not filter out non-HyperCore chains when isSource is true', () => {
      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, undefined, true);

      expect(result).toHaveLength(3);
      expect(result.map((c) => c.sdkName)).toEqual([
        'Ethereum',
        'Solana',
        'Polygon',
      ]);
    });
  });

  describe('isChainSupportedHandler', () => {
    it('should filter chains based on custom handler for source chains', () => {
      config.isChainSupportedHandler = vi.fn(
        (chain: Chain, type: 'source' | 'destination', network?) => {
          if (type === 'source' && chain === 'Ethereum') return false;
          return true;
        },
      );

      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, undefined, true);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.sdkName)).toEqual(['Solana', 'Polygon']);
      expect(config.isChainSupportedHandler).toHaveBeenCalledWith(
        'Ethereum',
        'source',
        'Mainnet',
      );
      expect(config.isChainSupportedHandler).toHaveBeenCalledWith(
        'Solana',
        'source',
        'Mainnet',
      );
    });

    it('should filter chains based on custom handler for destination chains', () => {
      config.isChainSupportedHandler = vi.fn(
        (chain: Chain, type: 'source' | 'destination', network?) => {
          if (type === 'destination' && chain === 'Polygon') return false;
          return true;
        },
      );

      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.sdkName)).toEqual(['Ethereum', 'Solana']);
      expect(config.isChainSupportedHandler).toHaveBeenCalledWith(
        'Ethereum',
        'destination',
        'Mainnet',
      );
      expect(config.isChainSupportedHandler).toHaveBeenCalledWith(
        'Polygon',
        'destination',
        'Mainnet',
      );
    });

    it('should not call handler when it is undefined', () => {
      config.isChainSupportedHandler = undefined;

      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(3);
    });

    it('should pass network parameter to handler correctly', () => {
      config.isChainSupportedHandler = vi.fn(() => true);

      const supportedChains: Array<Chain> = ['Ethereum', 'Solana'];
      getFilteredChains(supportedChains, undefined, false);

      // Verify network is passed as third parameter
      expect(config.isChainSupportedHandler).toHaveBeenCalledWith(
        'Ethereum',
        'destination',
        'Mainnet',
      );
    });
  });

  describe('combined filters', () => {
    it('should apply all filters together (isSource + chainToOmit + handler)', () => {
      vi.mocked(config.routes.isSameChainSwapSupported).mockReturnValue(false);
      config.isChainSupportedHandler = vi.fn((chain: Chain) => {
        return chain !== 'Polygon';
      });

      const supportedChains: Array<Chain> = [
        'Ethereum',
        'Solana',
        'Polygon',
        'HyperCore',
      ];
      const result = getFilteredChains(supportedChains, 'Ethereum', true);

      // Ethereum should be omitted (chainToOmit with no same-chain swap)
      // Polygon should be filtered by handler
      // HyperCore should be filtered by isSource (HyperCore chain)
      // Only Solana should remain
      expect(result).toHaveLength(1);
      expect(result.map((c) => c.sdkName)).toEqual(['Solana']);
    });

    it('should handle case where all chains are filtered out', () => {
      config.isChainSupportedHandler = vi.fn(() => false);

      const supportedChains: Array<Chain> = ['Ethereum', 'Solana', 'Polygon'];
      const result = getFilteredChains(supportedChains, undefined, false);

      expect(result).toHaveLength(0);
    });

    it('should apply filters in correct order', () => {
      vi.mocked(config.routes.isSameChainSwapSupported).mockReturnValue(false);
      config.isChainSupportedHandler = vi.fn(() => true);

      const supportedChains: Array<Chain> = [
        'Ethereum',
        'Solana',
        'HyperCore',
        'Polygon',
      ];
      const result = getFilteredChains(supportedChains, 'Ethereum', true);

      // First: filter by isSource (removes HyperCore)
      // Second: filter by supportedChains (all pass)
      // Third: filter by handler (all pass)
      // Fourth: filter by chainToOmit (removes Ethereum)
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.sdkName)).toEqual(['Solana', 'Polygon']);
    });
  });

  describe('edge cases', () => {
    it('should handle chain that exists in supportedChains but not in config.chainsArr', () => {
      const supportedChains: Array<Chain> = [
        'Ethereum',
        'UnknownChain' as Chain,
      ];
      const result = getFilteredChains(supportedChains, undefined, false);

      // Should only return chains that exist in config.chainsArr
      expect(result).toHaveLength(1);
      expect(result.map((c) => c.sdkName)).toEqual(['Ethereum']);
    });

    it('should handle same-chain swap check with a chain not in supportedChains', () => {
      vi.mocked(config.routes.isSameChainSwapSupported).mockReturnValue(false);
      const supportedChains: Array<Chain> = ['Ethereum', 'Solana'];
      const result = getFilteredChains(supportedChains, 'Polygon', false);

      // Polygon is not in supportedChains anyway, so omitting it has no effect
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.sdkName)).toEqual(['Ethereum', 'Solana']);
    });

    it('should handle when chainToOmit is the only chain in supportedChains', () => {
      vi.mocked(config.routes.isSameChainSwapSupported).mockReturnValue(false);
      const supportedChains: Array<Chain> = ['Ethereum'];
      const result = getFilteredChains(supportedChains, 'Ethereum', false);

      expect(result).toHaveLength(0);
    });

    it('should return all supported chains when no filters apply', () => {
      vi.mocked(config.routes.isSameChainSwapSupported).mockReturnValue(true);
      config.isChainSupportedHandler = undefined;

      const supportedChains: Array<Chain> = [
        'Ethereum',
        'Solana',
        'Polygon',
        'Avalanche',
      ];
      const result = getFilteredChains(supportedChains, 'Ethereum', false);

      expect(result).toHaveLength(4);
      expect(result.map((c) => c.sdkName)).toEqual([
        'Ethereum',
        'Solana',
        'Polygon',
        'Avalanche',
      ]);
    });
  });
});
