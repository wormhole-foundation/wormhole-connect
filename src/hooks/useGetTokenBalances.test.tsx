import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createMockToken } from 'utils/testHelpers';
import useGetTokenBalances from './useGetTokenBalances';

const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const RPC_URL = 'https://ethereum-rpc.publicnode.com';
const API_KEY = 'sk-super-secret-key';

const mockToken = createMockToken({
  chain: 'Ethereum',
  addressString: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  key: 'Ethereum:USDC',
});

const mockWallet = {
  type: 'Evm' as const,
  address: WALLET_ADDRESS,
  currentAddress: WALLET_ADDRESS,
  error: '',
  name: 'Test Wallet',
};

const getBalanceMock = vi.fn();

vi.mock('config', () => ({
  default: {
    network: 'Testnet',
    chains: { Ethereum: { sdkName: 'Ethereum' } },
    tokens: {
      get: vi.fn(() => mockToken),
    },
    evmIndexers: undefined,
  },
  getWormholeContextV2: vi.fn(async () => ({
    getPlatform: vi.fn(() => ({
      getRpc: vi.fn(),
      utils: vi.fn(() => ({
        getBalance: (...args: unknown[]) => getBalanceMock(...args),
      })),
    })),
  })),
}));

vi.mock('@wormhole-foundation/sdk', () => ({
  amount: {
    fromBaseUnits: vi.fn((value: bigint, decimals: number) => ({
      amount: value.toString(),
      decimals,
    })),
  },
  supportsIndexerUtils: vi.fn(() => false),
  Wormhole: {
    tokenId: vi.fn((chain: string, address: string) => ({ chain, address })),
  },
  routes: {},
}));

vi.mock('@wormhole-foundation/sdk-base', () => ({
  chainToPlatform: vi.fn(() => 'Evm'),
}));

vi.mock('contexts/TokensContext', () => ({
  useTokens: vi.fn(() => ({
    getOrFetchToken: vi.fn(async () => mockToken),
  })),
}));

vi.mock('utils/balanceCache', () => ({
  getCached: vi.fn(() => undefined),
  setCached: vi.fn(),
  markFailed: vi.fn(),
  isFailed: vi.fn(() => false),
}));

vi.mock('utils', () => ({
  sleep: vi.fn(),
  chainDisplayName: vi.fn(),
  getGasToken: vi.fn(),
  getTokenDisplaySymbolByTokenAddress: vi.fn(),
}));

const getRequest = () => ({
  chain: 'Ethereum' as const,
  wallet: mockWallet,
  tokens: [mockToken],
});

describe('useGetTokenBalances per-token fallback errors', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('logs a clarified retrieval error with structured context and no sensitive data', async () => {
    getBalanceMock.mockRejectedValue(
      new Error(
        `request to ${RPC_URL} failed for ${WALLET_ADDRESS} (api_key=${API_KEY})`,
      ),
    );

    const { result } = renderHook(() =>
      useGetTokenBalances({ source: getRequest() }),
    );

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

    const [message, context] = consoleErrorSpy.mock.calls[0] as [
      string,
      { reason: string },
    ];
    expect(message).toContain('Balance fetch failed');
    expect(message).toContain('unavailable');
    expect(message).not.toContain(RPC_URL);
    expect(message).not.toContain(WALLET_ADDRESS);

    expect(context).toMatchObject({
      network: 'Testnet',
      chain: 'Ethereum',
      token: 'Ethereum:USDC',
    });
    expect(typeof context.reason).toBe('string');
    expect(context.reason).not.toContain(RPC_URL);
    expect(context.reason).not.toContain(WALLET_ADDRESS);
    expect(context.reason).not.toContain(API_KEY);
    expect(JSON.stringify(context)).not.toContain(WALLET_ADDRESS);

    // A failed fetch must not be reported as a zero balance
    expect(result.current.source.balances['Ethereum:USDC']).toBeUndefined();
  });

  it('normalizes non-Error rejections into a bounded single-line reason', async () => {
    getBalanceMock.mockRejectedValue(
      `connection to ${RPC_URL} timed out\nafter retrying`,
    );

    const { result } = renderHook(() =>
      useGetTokenBalances({ source: getRequest() }),
    );

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

    const reason = (
      consoleErrorSpy.mock.calls[0] as [string, { reason: string }]
    )[1].reason;
    expect(reason).not.toContain('\n');
    expect(reason).not.toContain(RPC_URL);
    expect(reason.length).toBeLessThanOrEqual(204);

    expect(result.current.source.balances['Ethereum:USDC']).toBeUndefined();
  });

  it('keeps a successfully fetched zero balance distinct from an unavailable balance', async () => {
    getBalanceMock.mockResolvedValue(0n);

    const { result } = renderHook(() =>
      useGetTokenBalances({ source: getRequest() }),
    );

    await waitFor(() =>
      expect(result.current.source.balances['Ethereum:USDC']).toBeDefined(),
    );

    expect(result.current.source.balances['Ethereum:USDC'].balance).toEqual({
      amount: '0',
      decimals: 6,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
