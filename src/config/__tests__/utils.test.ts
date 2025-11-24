import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateDefaults } from '../utils';
import type { DefaultInputs } from '../ui';
import type { ChainsConfig } from '../types';
import type { TokenCache } from '../tokens';

describe('utils', () => {
  describe('validateDefaults()', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    const mockChains: ChainsConfig = {
      Ethereum: {} as any,
      Solana: {} as any,
      Polygon: {} as any,
    };

    const mockTokens: TokenCache = {
      findByAddressOrSymbol: vi.fn((chain: string, token: string) => {
        if (chain === 'Ethereum' && token === 'USDC') return { symbol: 'USDC' };
        if (chain === 'Solana' && token === 'SOL') return { symbol: 'SOL' };
        if (chain === 'Ethereum' && token === 'native')
          return { symbol: 'ETH' };
        if (chain === 'Solana' && token === 'native') return { symbol: 'SOL' };
        return null;
      }),
    } as any;

    it('returns undefined when defaults is undefined', () => {
      const result = validateDefaults(undefined as any, mockChains, mockTokens);
      expect(result).toBeUndefined();
    });

    it('validates valid source chain', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum' },
      };

      const result = validateDefaults(defaults, mockChains, mockTokens);
      expect(result).toBeDefined();
      expect(result?.source).toBeDefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('removes source when invalid chain name is provided', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'InvalidChain' as any },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(defaults.source).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Invalid chain name "InvalidChain" specified for defaultInputs.source.chain',
      );
    });

    it('validates valid destination chain', () => {
      const defaults: DefaultInputs = {
        destination: { chain: 'Solana' },
      };

      const result = validateDefaults(defaults, mockChains, mockTokens);
      expect(result).toBeDefined();
      expect(result?.destination).toBeDefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('removes destination when invalid chain name is provided', () => {
      const defaults: DefaultInputs = {
        destination: { chain: 'InvalidChain' as any },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(defaults.destination).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Invalid chain name "InvalidChain" specified for defaultInputs.destination.chain',
      );
    });

    it('errors when source and destination tokens are the same (non-native)', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'USDC' },
        destination: { chain: 'Solana', token: 'USDC' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Source and destination token cannot be the same, check the defaultInputs configuration',
      );
    });

    it('allows source and destination tokens to be the same when both are native', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'native' },
        destination: { chain: 'Solana', token: 'native' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(
          'Source and destination token cannot be the same',
        ),
      );
    });

    it('errors when source and destination chain and token are identical', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'USDC' },
        destination: { chain: 'Ethereum', token: 'USDC' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Source and destination cannot be the same when both chain and token are identical, check the defaultInputs configuration',
      );
    });

    it('errors when source and destination chain and native token are identical', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'native' },
        destination: { chain: 'Ethereum', token: 'native' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Source and destination cannot be the same when both chain and token are identical, check the defaultInputs configuration',
      );
    });

    it('does not error when chains are different but tokens are the same native', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'native' },
        destination: { chain: 'Solana', token: 'native' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('both chain and token are identical'),
      );
    });

    it('errors when requiredChain is invalid', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum' },
        destination: { chain: 'Solana' },
        requiredChain: 'InvalidChain' as any,
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Invalid network value "InvalidChain" specified for defaultInputs.requiredChain',
      );
    });

    it('errors when requiredChain does not match source or destination', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum' },
        destination: { chain: 'Solana' },
        requiredChain: 'Polygon',
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Source chain or destination chain must equal the required network',
      );
    });

    it('validates when requiredChain matches source chain', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum' },
        destination: { chain: 'Solana' },
        requiredChain: 'Ethereum',
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('must equal the required network'),
      );
    });

    it('validates when requiredChain matches destination chain', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum' },
        destination: { chain: 'Solana' },
        requiredChain: 'Solana',
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('must equal the required network'),
      );
    });

    it('validates valid source token', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'USDC' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(defaults.source?.token).toBe('USDC');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('removes invalid source token', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'INVALID_TOKEN' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(defaults.source?.token).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Invalid token "INVALID_TOKEN" specified for defaultInputs.source.token',
      );
    });

    it('validates valid destination token', () => {
      const defaults: DefaultInputs = {
        destination: { chain: 'Solana', token: 'SOL' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(defaults.destination?.token).toBe('SOL');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('removes invalid destination token', () => {
      const defaults: DefaultInputs = {
        destination: { chain: 'Solana', token: 'INVALID_TOKEN' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(defaults.destination?.token).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Wormhole Connect: Invalid token "INVALID_TOKEN" specified for defaultInputs.destination.token',
      );
    });

    it('does not validate token when token is not specified', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum' },
      };

      const result = validateDefaults(defaults, mockChains, mockTokens);
      // Should succeed without token validation
      expect(result?.source?.chain).toBe('Ethereum');
      expect(result?.source?.token).toBeUndefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('handles complex valid configuration', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'USDC' },
        destination: { chain: 'Solana', token: 'SOL' },
        requiredChain: 'Ethereum',
        preferredRouteName: 'bridge',
      };

      const result = validateDefaults(defaults, mockChains, mockTokens);
      expect(result).toBeDefined();
      expect(result?.source?.chain).toBe('Ethereum');
      expect(result?.source?.token).toBe('USDC');
      expect(result?.destination?.chain).toBe('Solana');
      expect(result?.destination?.token).toBe('SOL');
      expect(result?.requiredChain).toBe('Ethereum');
      expect(result?.preferredRouteName).toBe('bridge');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('handles multiple validation errors', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'InvalidChain' as any, token: 'INVALID_TOKEN' },
        destination: { chain: 'Solana', token: 'INVALID_TOKEN' },
      };

      validateDefaults(defaults, mockChains, mockTokens);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it('returns the defaults object after validation', () => {
      const defaults: DefaultInputs = {
        source: { chain: 'Ethereum', token: 'USDC' },
      };

      const result = validateDefaults(defaults, mockChains, mockTokens);
      expect(result).toBe(defaults);
    });
  });
});
