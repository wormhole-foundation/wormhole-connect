import { describe, it, expect } from 'vitest';

import '@wormhole-foundation/sdk-evm';

import { Wormhole } from '@wormhole-foundation/sdk-connect';
import { isTokenSupported } from './utils';

describe('Monad Bridge - isTokenSupported', () => {
  describe('Mainnet Allowlist - Supported Tokens', () => {
    it('should support ETH from Ethereum', () => {
      const sourceToken = Wormhole.tokenId('Ethereum', 'native'); // ETH
      const mockFromChain = {
        chain: 'Ethereum',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(true);
    });

    it('should support WETH from Ethereum', () => {
      const sourceToken = Wormhole.tokenId(
        'Ethereum',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      ); // WETH
      const mockFromChain = {
        chain: 'Ethereum',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(true);
    });

    it('should support WMON from Ethereum', () => {
      const sourceToken = Wormhole.tokenId(
        'Ethereum',
        '0x6917037F8944201b2648198a89906Edf863B9517',
      ); // WMON on Ethereum
      const mockFromChain = {
        chain: 'Ethereum',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(true);
    });

    it('should support MON (native) from Monad', () => {
      const sourceToken = Wormhole.tokenId('Monad', 'native'); // MON
      const mockFromChain = {
        chain: 'Monad',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(true);
    });

    it('should support WMON from Monad', () => {
      const sourceToken = Wormhole.tokenId(
        'Monad',
        '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
      ); // WMON on Monad
      const mockFromChain = {
        chain: 'Monad',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(true);
    });

    it('should support WETH from Monad', () => {
      const sourceToken = Wormhole.tokenId(
        'Monad',
        '0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242',
      ); // WETH on Monad (NTT Token)
      const mockFromChain = {
        chain: 'Monad',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(true);
    });
  });

  describe('Mainnet Allowlist - Unsupported Tokens', () => {
    it('should NOT support USDC from Ethereum (not in allowlist)', () => {
      const sourceToken = Wormhole.tokenId(
        'Ethereum',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      ); // USDC
      const mockFromChain = {
        chain: 'Ethereum',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(false);
    });

    it('should NOT support USDT from Ethereum (not in allowlist)', () => {
      const sourceToken = Wormhole.tokenId(
        'Ethereum',
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      ); // USDT
      const mockFromChain = {
        chain: 'Ethereum',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(false);
    });

    it('should NOT support random token from Ethereum (not in allowlist)', () => {
      const sourceToken = Wormhole.tokenId(
        'Ethereum',
        '0x1234567890123456789012345678901234567890',
      );
      const mockFromChain = {
        chain: 'Ethereum',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(false);
    });

    it('should NOT support random token from Monad (not in allowlist)', () => {
      const sourceToken = Wormhole.tokenId(
        'Monad',
        '0x1234567890123456789012345678901234567890',
      );
      const mockFromChain = {
        chain: 'Monad',
        network: 'Mainnet' as const,
      };

      const result = isTokenSupported(sourceToken, mockFromChain as any);

      expect(result).toBe(false);
    });
  });
});
