import { describe, it, expect, beforeEach } from 'vitest';
import type { routes } from '@wormhole-foundation/sdk-connect';
import type { Network } from '@wormhole-foundation/sdk-base';
import { MayanRouteMONOCHAIN } from '../MayanRouteMONOCHAIN';
import { MayanRouteFastMCTP } from '../MayanRouteFastMCTP';
import { MayanRouteMCTP } from '../MayanRouteMCTP';
import { MayanRouteSWIFT } from '../MayanRouteSWIFT';
import { MayanRouteWH } from '../MayanRouteWH';
import type { TransferParams } from '../types';

describe('Mayan Routes - Validation', () => {
  let mockWormhole: any;
  let mockParams: TransferParams;

  beforeEach(() => {
    mockWormhole = {
      network: 'Mainnet' as Network,
    };

    mockParams = {
      amount: '100',
      options: {
        gasDrop: 0,
        slippageBps: 'auto',
        optimizeFor: 'speed',
      },
    };
  });

  describe('MayanRouteMONOCHAIN - Same-chain validation', () => {
    let route: MayanRouteMONOCHAIN<'Mainnet'>;

    beforeEach(() => {
      route = new MayanRouteMONOCHAIN(mockWormhole);
    });

    it('should return valid for same-chain swap (Ethereum to Ethereum)', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Ethereum', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('should return valid for same-chain swap (Solana to Solana)', async () => {
      const request = {
        fromChain: { chain: 'Solana', network: 'Mainnet' },
        toChain: { chain: 'Solana', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for cross-chain swap (Ethereum to Solana)', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Solana', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('same');
      }
    });

    it('should return invalid for cross-chain swap (Solana to Ethereum)', async () => {
      const request = {
        fromChain: { chain: 'Solana', network: 'Mainnet' },
        toChain: { chain: 'Ethereum', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('MayanRouteFastMCTP - Cross-chain validation', () => {
    let route: MayanRouteFastMCTP<'Mainnet'>;

    beforeEach(() => {
      route = new MayanRouteFastMCTP(mockWormhole);
    });

    it('should return valid for cross-chain swap (Ethereum to Solana)', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Solana', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('should return valid for cross-chain swap (Solana to Ethereum)', async () => {
      const request = {
        fromChain: { chain: 'Solana', network: 'Mainnet' },
        toChain: { chain: 'Ethereum', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for same-chain swap (Ethereum to Ethereum)', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Ethereum', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('same-chain');
      }
    });

    it('should return invalid for same-chain swap (Solana to Solana)', async () => {
      const request = {
        fromChain: { chain: 'Solana', network: 'Mainnet' },
        toChain: { chain: 'Solana', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('MayanRouteMCTP - Cross-chain validation', () => {
    let route: MayanRouteMCTP<'Mainnet'>;

    beforeEach(() => {
      route = new MayanRouteMCTP(mockWormhole);
    });

    it('should return valid for cross-chain swap', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Solana', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for same-chain swap', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Ethereum', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
    });
  });

  describe('MayanRouteSWIFT - Cross-chain validation', () => {
    let route: MayanRouteSWIFT<'Mainnet'>;

    beforeEach(() => {
      route = new MayanRouteSWIFT(mockWormhole);
    });

    it('should return valid for cross-chain swap', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Solana', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for same-chain swap', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Ethereum', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
    });
  });

  describe('MayanRouteWH - Cross-chain validation', () => {
    let route: MayanRouteWH<'Mainnet'>;

    beforeEach(() => {
      route = new MayanRouteWH(mockWormhole);
    });

    it('should return valid for cross-chain swap', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Solana', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for same-chain swap', async () => {
      const request = {
        fromChain: { chain: 'Ethereum', network: 'Mainnet' },
        toChain: { chain: 'Ethereum', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
    });
  });

  describe('Edge cases - Different chains', () => {
    it('MONO_CHAIN should reject Avalanche to Polygon', async () => {
      const route = new MayanRouteMONOCHAIN(mockWormhole);
      const request = {
        fromChain: { chain: 'Avalanche', network: 'Mainnet' },
        toChain: { chain: 'Polygon', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
    });

    it('FastMCTP should accept Avalanche to Polygon', async () => {
      const route = new MayanRouteFastMCTP(mockWormhole);
      const request = {
        fromChain: { chain: 'Avalanche', network: 'Mainnet' },
        toChain: { chain: 'Polygon', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });

    it('FastMCTP should reject Sui to Sui', async () => {
      const route = new MayanRouteFastMCTP(mockWormhole);
      const request = {
        fromChain: { chain: 'Sui', network: 'Mainnet' },
        toChain: { chain: 'Sui', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(false);
    });

    it('MONO_CHAIN should accept Sui to Sui', async () => {
      const route = new MayanRouteMONOCHAIN(mockWormhole);
      const request = {
        fromChain: { chain: 'Sui', network: 'Mainnet' },
        toChain: { chain: 'Sui', network: 'Mainnet' },
      } as routes.RouteTransferRequest<'Mainnet'>;

      const result = await route.validate(request, mockParams);

      expect(result.valid).toBe(true);
    });
  });
});
