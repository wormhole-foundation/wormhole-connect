import { describe, it, expect, vi, beforeEach } from 'vitest';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import {
  getTokenPreferenceScore,
  calculateTokenUSDBalance,
  sortTokensByPreference,
  applyCustomTokenSupport,
  applySpamFilter,
  filterTokensByBalance,
} from './tokenListUtils';
import type { Token } from 'config/tokens';
import type { Balances } from './wallet/types';
import { createMockToken } from './testHelpers';

// Mock dependencies
vi.mock('@wormhole-foundation/sdk', async () => {
  const actual = await vi.importActual('@wormhole-foundation/sdk');
  return {
    ...actual,
    circle: {
      usdcContract: {
        get: vi.fn((network: string, chain: string) => {
          // Mock USDC addresses
          if (chain === 'Ethereum' && network === 'Mainnet') {
            return '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
          }
          return undefined;
        }),
      },
    },
  };
});

vi.mock('config', () => ({
  default: {
    network: 'Mainnet',
    tokenWhitelist: undefined,
    isTokenSupportedHandler: undefined,
    tokens: {
      get: vi.fn(),
      queryBySymbol: vi.fn(() => []),
    },
  },
}));

vi.mock('utils', () => ({
  calculateUSDPriceRaw: vi.fn((getPrice: any, balance: any, token: any) => {
    const price = typeof getPrice === 'function' ? getPrice(token) : getPrice;
    if (!price || !balance) return undefined;
    return 100 * price; // Simplified calculation
  }),
  isFrankensteinToken: vi.fn(() => false),
}));

vi.mock('./ntt', () => ({
  isNttToken: vi.fn(() => false),
}));

vi.mock('./address', () => ({
  normalizeAddress: vi.fn((address: string, chain: string) => {
    // Mock EVM chains as case-insensitive, others as case-sensitive
    const evmChains = [
      'Ethereum',
      'Bsc',
      'Polygon',
      'Arbitrum',
      'Optimism',
      'Base',
    ];
    if (evmChains.includes(chain)) {
      return address.toLowerCase();
    }
    return address; // Preserve case for Solana, Sui, etc.
  }),
}));

vi.mock('config/tokens', () => ({
  isSameToken: vi.fn((a: any, b: any) => {
    return a.chain === b.chain && a.addressString === b.addressString;
  }),
  tokenKey: vi.fn((token: any) => `${token.chain}:${token.addressString}`),
  isTokenTuple: vi.fn((item: any) => Array.isArray(item)),
  tokenIdFromTuple: vi.fn((tuple: any) => ({
    chain: tuple[0],
    address: { toString: () => tuple[1] },
  })),
}));

describe('tokenListUtils', () => {
  describe('getTokenPreferenceScore', () => {
    it('should return 5 for selected token', () => {
      const token = createMockToken({ symbol: 'ETH' });
      const score = getTokenPreferenceScore(token, token);
      expect(score).toBe(5);
    });

    it('should return 4 for destination token matching source symbol (both native)', () => {
      const sourceToken = createMockToken({
        symbol: 'USDC',
        chain: 'Ethereum',
        isTokenBridgeWrappedToken: false,
      });
      const destToken = createMockToken({
        symbol: 'USDC',
        chain: 'Arbitrum',
        isTokenBridgeWrappedToken: false,
      });
      const score = getTokenPreferenceScore(destToken, undefined, sourceToken);
      expect(score).toBe(4);
    });

    it('should NOT prioritize wrapped destination when source is native', () => {
      const sourceToken = createMockToken({
        symbol: 'USDC',
        chain: 'Ethereum',
        isTokenBridgeWrappedToken: false,
      });
      const wrappedDestToken = createMockToken({
        symbol: 'USDC',
        chain: 'Arbitrum',
        isTokenBridgeWrappedToken: true,
      });
      const score = getTokenPreferenceScore(
        wrappedDestToken,
        undefined,
        sourceToken,
      );
      expect(score).toBe(0); // Falls through to wrapped token score
    });

    it('should prioritize native destination when source is wrapped', () => {
      const wrappedSourceToken = createMockToken({
        symbol: 'USDC',
        chain: 'Ethereum',
        isTokenBridgeWrappedToken: true,
      });
      const nativeDestToken = createMockToken({
        symbol: 'USDC',
        chain: 'Arbitrum',
        isTokenBridgeWrappedToken: false,
      });
      const score = getTokenPreferenceScore(
        nativeDestToken,
        undefined,
        wrappedSourceToken,
      );
      expect(score).toBe(4);
    });

    it('should NOT prioritize wrapped destination even when source is wrapped', () => {
      const wrappedSourceToken = createMockToken({
        symbol: 'USDC',
        chain: 'Ethereum',
        isTokenBridgeWrappedToken: true,
      });
      const wrappedDestToken = createMockToken({
        symbol: 'USDC',
        chain: 'Arbitrum',
        isTokenBridgeWrappedToken: true,
      });
      const score = getTokenPreferenceScore(
        wrappedDestToken,
        undefined,
        wrappedSourceToken,
      );
      expect(score).toBe(0); // Wrapped destinations are never prioritized
    });

    it('should return 3 for native gas tokens', () => {
      const nativeToken = createMockToken({
        addressString: 'native',
        isNativeGasToken: true,
      });
      const score = getTokenPreferenceScore(nativeToken);
      expect(score).toBe(3);
    });

    it('should return 2 for USDC tokens', () => {
      const usdcToken = createMockToken({
        chain: 'Ethereum',
        addressString: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
      });
      const score = getTokenPreferenceScore(usdcToken);
      expect(score).toBe(2);
    });

    it('should return 1 for native non-wrapped tokens', () => {
      const nativeToken = createMockToken({
        isTokenBridgeWrappedToken: false,
      });
      const score = getTokenPreferenceScore(nativeToken);
      expect(score).toBe(1);
    });

    it('should return 0 for wrapped tokens', () => {
      const wrappedToken = createMockToken({
        isTokenBridgeWrappedToken: true,
      });
      const score = getTokenPreferenceScore(wrappedToken);
      expect(score).toBe(0);
    });

    it('should prioritize selected token over source symbol match', () => {
      const selectedToken = createMockToken({ symbol: 'ETH' });
      const sourceToken = createMockToken({ symbol: 'USDC' });

      const scoreSelected = getTokenPreferenceScore(
        selectedToken,
        selectedToken,
        sourceToken,
      );
      const scoreSourceMatch = getTokenPreferenceScore(
        createMockToken({ symbol: 'USDC' }),
        undefined,
        sourceToken,
      );

      expect(scoreSelected).toBeGreaterThan(scoreSourceMatch);
    });
  });

  describe('calculateTokenUSDBalance', () => {
    const mockGetPrice = vi.fn((token: Token) => {
      if (token.symbol === 'ETH') return 2000;
      if (token.symbol === 'USDC') return 1;
      return undefined;
    });

    beforeEach(() => {
      mockGetPrice.mockClear();
    });

    it('should calculate USD balance correctly', () => {
      const token = createMockToken({ symbol: 'ETH' });
      const balances: Balances = {
        'Ethereum:0x1234567890abcdef': {
          lastUpdated: Date.now(),
          balance: sdkAmount.fromBaseUnits(1000000000000000000n, 18), // 1 ETH
        },
      };

      const usdBalance = calculateTokenUSDBalance(
        token,
        balances,
        mockGetPrice,
      );
      expect(usdBalance).toBe(200000);
      expect(mockGetPrice).toHaveBeenCalledWith(token);
    });

    it('should return 0 for missing balance', () => {
      const token = createMockToken();
      const balances: Balances = {};

      const usdBalance = calculateTokenUSDBalance(
        token,
        balances,
        mockGetPrice,
      );
      expect(usdBalance).toBe(0);
    });

    it('should return 0 for zero balance', () => {
      const token = createMockToken();
      const balances: Balances = {
        'Ethereum:0x1234567890abcdef': {
          lastUpdated: Date.now(),
          balance: { amount: '0', decimals: 18 },
        },
      };

      const usdBalance = calculateTokenUSDBalance(
        token,
        balances,
        mockGetPrice,
      );
      expect(usdBalance).toBe(0);
    });

    it('should return 0 when price is unavailable', () => {
      const token = createMockToken({ symbol: 'UNKNOWN' });
      const balances: Balances = {
        'Ethereum:0x1234567890abcdef': {
          lastUpdated: Date.now(),
          balance: sdkAmount.fromBaseUnits(1000000000000000000n, 18),
        },
      };

      const usdBalance = calculateTokenUSDBalance(
        token,
        balances,
        mockGetPrice,
      );
      expect(usdBalance).toBe(0);
    });
  });

  describe('sortTokensByPreference', () => {
    it('should sort by preference score first', () => {
      const nativeToken = createMockToken({
        symbol: 'ETH',
        addressString: 'native',
        isNativeGasToken: true,
      });
      const wrappedToken = createMockToken({
        symbol: 'WETH',
        isTokenBridgeWrappedToken: true,
      });
      const regularToken = createMockToken({
        symbol: 'DAI',
        isTokenBridgeWrappedToken: false,
      });

      const tokens = [wrappedToken, regularToken, nativeToken];
      const balances: Balances = {};
      const getPrice = () => undefined;

      const sorted = sortTokensByPreference(
        tokens,
        undefined,
        balances,
        getPrice,
      );

      expect(sorted[0]).toBe(nativeToken); // Score 3
      expect(sorted[1]).toBe(regularToken); // Score 1
      expect(sorted[2]).toBe(wrappedToken); // Score 0
    });

    it('should sort by USD balance when scores are equal', () => {
      const token1 = createMockToken({ symbol: 'AAA', addressString: '0x111' });
      const token2 = createMockToken({ symbol: 'BBB', addressString: '0x222' });

      const balances: Balances = {
        'Ethereum:0x111': {
          lastUpdated: Date.now(),
          balance: sdkAmount.fromBaseUnits(1000000000000000000n, 18), // 1 token
        },
        'Ethereum:0x222': {
          lastUpdated: Date.now(),
          balance: sdkAmount.fromBaseUnits(2000000000000000000n, 18), // 2 tokens
        },
      };

      const getPrice = (token: Token) => (token.symbol === 'AAA' ? 100 : 200);

      const tokens = [token1, token2];
      const sorted = sortTokensByPreference(
        tokens,
        undefined,
        balances,
        getPrice,
      );

      // token2 has higher USD balance (2 * 200 = 400) vs token1 (1 * 100 = 100)
      expect(sorted[0].symbol).toBe('BBB');
      expect(sorted[1].symbol).toBe('AAA');
    });

    it('should sort alphabetically by symbol when score and balance are equal', () => {
      const tokenZ = createMockToken({ symbol: 'ZZZ' });
      const tokenA = createMockToken({ symbol: 'AAA' });
      const tokenM = createMockToken({ symbol: 'MMM' });

      const tokens = [tokenZ, tokenA, tokenM];
      const balances: Balances = {};
      const getPrice = () => undefined;

      const sorted = sortTokensByPreference(
        tokens,
        undefined,
        balances,
        getPrice,
      );

      expect(sorted[0].symbol).toBe('AAA');
      expect(sorted[1].symbol).toBe('MMM');
      expect(sorted[2].symbol).toBe('ZZZ');
    });

    it('should prioritize source symbol match in destination list', () => {
      const sourceToken = createMockToken({
        symbol: 'USDC',
        chain: 'Ethereum',
      });
      const usdcArbitrum = createMockToken({
        symbol: 'USDC',
        chain: 'Arbitrum',
      });
      const ethArbitrum = createMockToken({
        symbol: 'ETH',
        chain: 'Arbitrum',
        addressString: 'native',
        isNativeGasToken: true,
      });

      const tokens = [ethArbitrum, usdcArbitrum];
      const balances: Balances = {};
      const getPrice = () => undefined;

      const sorted = sortTokensByPreference(
        tokens,
        undefined,
        balances,
        getPrice,
        sourceToken,
      );

      // USDC (score 4) should come before ETH native (score 3)
      expect(sorted[0].symbol).toBe('USDC');
      expect(sorted[1].symbol).toBe('ETH');
    });
  });

  describe('applySpamFilter', () => {
    it('should filter out unknown tokens (basic mode)', () => {
      const unknownToken = createMockToken({
        isNativeGasToken: false,
        isBuiltin: false,
        isTokenBridgeWrappedToken: false,
      });
      const tokens = [unknownToken];
      const filtered = applySpamFilter(tokens);
      expect(filtered).toHaveLength(0);
    });

    it('should filter mixed token list correctly (basic mode)', () => {
      const nativeToken = createMockToken({
        isNativeGasToken: true,
        symbol: 'ETH',
      });
      const unknownToken = createMockToken({ symbol: 'SCAM' });
      const verifiedToken = createMockToken({
        symbol: 'USDC',
        coingeckoWebId: 'usd-coin',
      });

      const tokens = [unknownToken, nativeToken, verifiedToken];
      const filtered = applySpamFilter(tokens);

      expect(filtered).toHaveLength(2);
      expect(filtered.find((t) => t.symbol === 'SCAM')).toBeUndefined();
      expect(filtered.find((t) => t.symbol === 'ETH')).toBeDefined();
      expect(filtered.find((t) => t.symbol === 'USDC')).toBeDefined();
    });

    it('should use strict filtering when CoinGecko data provided', () => {
      const nativeToken = createMockToken({
        isNativeGasToken: true,
        symbol: 'ETH',
        addressString: 'native',
      });
      const verifiedToken = createMockToken({
        symbol: 'USDC',
        addressString: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      });
      const spamToken = createMockToken({
        symbol: 'SCAM',
        addressString: '0xdeadbeef',
      });

      const coingeckoAddresses = new Set([
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      ]);

      const tokens = [spamToken, nativeToken, verifiedToken];
      const filtered = applySpamFilter(tokens, coingeckoAddresses);

      expect(filtered).toHaveLength(2);
      expect(filtered.find((t) => t.symbol === 'SCAM')).toBeUndefined();
      expect(filtered.find((t) => t.symbol === 'ETH')).toBeDefined();
      expect(filtered.find((t) => t.symbol === 'USDC')).toBeDefined();
    });

    it('should always include built-in tokens even with CoinGecko filtering', () => {
      const builtinToken = createMockToken({
        symbol: 'CUSTOM',
        addressString: '0xcustom',
        isBuiltin: true,
      });

      const coingeckoAddresses = new Set([]); // Empty - token not in CoinGecko

      const tokens = [builtinToken];
      const filtered = applySpamFilter(tokens, coingeckoAddresses);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(builtinToken);
    });

    it('should always include Token Bridge wrapped tokens', () => {
      const wrappedToken = createMockToken({
        symbol: 'WETH',
        addressString: '0xwrapped',
        isTokenBridgeWrappedToken: true,
      });

      const coingeckoAddresses = new Set(['0xother']); // Token not in list

      const tokens = [wrappedToken];
      const filtered = applySpamFilter(tokens, coingeckoAddresses);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(wrappedToken);
    });

    it('should always include tokens with coingeckoWebId', () => {
      const knownToken = createMockToken({
        symbol: 'KNOWN',
        addressString: '0xknown',
        coingeckoWebId: 'known-token',
      });

      const coingeckoAddresses = new Set(['0xother']); // Token not in list

      const tokens = [knownToken];
      const filtered = applySpamFilter(tokens, coingeckoAddresses);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(knownToken);
    });

    it('should use case-insensitive matching for EVM chains', () => {
      const evmToken = createMockToken({
        chain: 'Ethereum',
        symbol: 'USDC',
        addressString: '0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48', // Uppercase
      });

      // CoinGecko list has lowercase addresses
      const coingeckoAddresses = new Set([
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ]);

      const tokens = [evmToken];
      const filtered = applySpamFilter(tokens, coingeckoAddresses);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(evmToken);
    });

    it('should use case-sensitive matching for Solana', () => {
      const solanaToken = createMockToken({
        chain: 'Solana',
        symbol: 'BONK',
        addressString: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      });

      // CoinGecko list with exact case
      const coingeckoAddresses = new Set([
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      ]);

      const tokens = [solanaToken];
      const filtered = applySpamFilter(tokens, coingeckoAddresses);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(solanaToken);
    });

    it('should filter out Solana token if case does not match', () => {
      const solanaToken = createMockToken({
        chain: 'Solana',
        symbol: 'BONK',
        addressString: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      });

      // CoinGecko list with different case (simulating a mismatch)
      const coingeckoAddresses = new Set([
        'dezxaz8z7pnrnrjjz3wxborgixca6xjnb7yab1ppb263', // lowercase - wrong!
      ]);

      const tokens = [solanaToken];
      const filtered = applySpamFilter(tokens, coingeckoAddresses);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterTokensByBalance', () => {
    it('should return all tokens when no wallet connected', () => {
      const tokens = [createMockToken(), createMockToken()];
      const balances = {};
      const filtered = filterTokensByBalance(tokens, balances, undefined);
      expect(filtered).toHaveLength(2);
    });

    it('should filter to tokens with non-zero balance', () => {
      const token1 = createMockToken({ addressString: '0x111' });
      const token2 = createMockToken({ addressString: '0x222' });
      const token3 = createMockToken({ addressString: '0x333' });

      const balances = {
        'Ethereum:0x111': {
          balance: sdkAmount.fromBaseUnits(1000000n, 6), // Non-zero
        },
        'Ethereum:0x222': {
          balance: sdkAmount.fromBaseUnits(0n, 6), // Zero
        },
        'Ethereum:0x333': {
          balance: sdkAmount.fromBaseUnits(5000000n, 6), // Non-zero
        },
      };

      const tokens = [token1, token2, token3];
      const filtered = filterTokensByBalance(tokens, balances, '0x123');

      expect(filtered).toHaveLength(2);
      expect(filtered.find((t) => t.addressString === '0x111')).toBeDefined();
      expect(filtered.find((t) => t.addressString === '0x222')).toBeUndefined();
      expect(filtered.find((t) => t.addressString === '0x333')).toBeDefined();
    });
  });

  describe('applyCustomTokenSupport', () => {
    it('should return all tokens when no custom handler set', () => {
      const tokens = [createMockToken(), createMockToken()];
      const filtered = applyCustomTokenSupport(tokens);
      expect(filtered).toHaveLength(2);
    });

    it('should apply custom filter when handler is set', async () => {
      const config = await import('config');
      const token1 = createMockToken({ symbol: 'ALLOWED' });
      const token2 = createMockToken({ symbol: 'BLOCKED' });

      config.default.isTokenSupportedHandler = (token: Token) =>
        token.symbol === 'ALLOWED';

      const tokens = [token1, token2];
      const filtered = applyCustomTokenSupport(tokens);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(token1);

      // Cleanup
      config.default.isTokenSupportedHandler = undefined;
    });

    it('should apply custom filter based on token type', async () => {
      const config = await import('config');
      const token1 = createMockToken({ symbol: 'ALLOWED' });
      const token2 = createMockToken({ symbol: 'BLOCKED' });

      config.default.isTokenSupportedHandler = (
        token: Token,
        sourceToken,
        tokenType,
      ) => tokenType === 'source';

      const tokens = [token1, token2];
      let filtered = applyCustomTokenSupport(tokens, undefined, true);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toBe(token1);
      expect(filtered[1]).toBe(token2);

      filtered = applyCustomTokenSupport(tokens, undefined, false);

      expect(filtered).toHaveLength(0);

      // Cleanup
      config.default.isTokenSupportedHandler = undefined;
    });
  });
});
