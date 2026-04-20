import { describe, it, expect, vi, beforeEach } from 'vitest';
import RouteOperator from '../operator';
import { TransactionId } from '@wormhole-foundation/sdk';

// Mock the config
vi.mock('config', () => ({
  default: {
    wormholeApi: 'https://api.wormholescan.io/',
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('RouteOperator', () => {
  let routeOperator: RouteOperator;

  beforeEach(() => {
    routeOperator = new RouteOperator();
    vi.clearAllMocks();
  });

  describe('resumeFromTx with Wormholescan API', () => {
    it('should use Wormholescan API to identify CCTP routes', async () => {
      const mockTx: TransactionId = {
        chain: 'Ethereum',
        txid: '0x1234567890abcdef',
      };

      // Mock Wormholescan API response for CCTP transfer
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          operations: [
            {
              content: {
                standarizedProperties: {
                  appIds: ['CCTP_WORMHOLE_INTEGRATION'],
                },
              },
            },
          ],
        }),
      });

      // Mock the route's resumeIfManual to simulate CCTP route success
      const mockReceipt = { state: 'Attested' };
      const cctpRoute = routeOperator.routes['ManualCCTP'];
      if (cctpRoute) {
        cctpRoute.resumeIfManual = vi.fn().mockResolvedValue(mockReceipt);
      }

      const result = await routeOperator.resumeFromTx(mockTx);

      // Verify Wormholescan API was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.wormholescan.io/api/v1/operations?txHash=0x1234567890abcdef',
        { headers: { accept: 'application/json' } },
      );

      // Verify only CCTP routes were tried
      if (cctpRoute) {
        expect(cctpRoute.resumeIfManual).toHaveBeenCalled();
      }

      // Verify non-CCTP routes were not tried
      const tokenBridgeRoute = routeOperator.routes['ManualTokenBridge'];
      if (tokenBridgeRoute && tokenBridgeRoute.resumeIfManual) {
        expect(tokenBridgeRoute.resumeIfManual).not.toHaveBeenCalled();
      }
    });

    it('should fall back to brute force when Wormholescan API fails', async () => {
      const mockTx: TransactionId = {
        chain: 'Ethereum',
        txid: '0x1234567890abcdef',
      };

      // Mock Wormholescan API to fail
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      // Mock all routes to fail except one
      Object.values(routeOperator.routes).forEach((route) => {
        route.resumeIfManual = vi.fn().mockResolvedValue(null);
      });

      const tokenBridgeRoute = routeOperator.routes['ManualTokenBridge'];
      const mockReceipt = { state: 'Attested' };
      if (tokenBridgeRoute) {
        tokenBridgeRoute.resumeIfManual = vi
          .fn()
          .mockResolvedValue(mockReceipt);
      }

      const result = await routeOperator.resumeFromTx(mockTx);

      // Verify all routes were tried (brute force)
      Object.values(routeOperator.routes).forEach((route) => {
        expect(route.resumeIfManual).toHaveBeenCalled();
      });

      expect(result).toEqual({
        route: 'ManualTokenBridge',
        receipt: mockReceipt,
      });
    });

    it('should handle Wormholescan API returning no operations', async () => {
      const mockTx: TransactionId = {
        chain: 'Ethereum',
        txid: '0x1234567890abcdef',
      };

      // Mock Wormholescan API response with no operations
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          operations: [],
        }),
      });

      // Mock a route to succeed
      const tokenBridgeRoute = routeOperator.routes['ManualTokenBridge'];
      const mockReceipt = { state: 'Attested' };
      if (tokenBridgeRoute) {
        tokenBridgeRoute.resumeIfManual = vi
          .fn()
          .mockResolvedValue(mockReceipt);
      }

      await routeOperator.resumeFromTx(mockTx);

      // Verify it fell back to brute force
      expect(tokenBridgeRoute.resumeIfManual).toHaveBeenCalled();
    });
  });
});
