import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { Chain } from '@wormhole-foundation/sdk';
import useConnectToLastUsedWallet from '../useConnectToLastUsedWallet';
import { TransferWallet } from 'utils/wallet';

const mockConnectWallet = vi.fn();
const mockSwapWallets = vi.fn();

vi.mock('../useWalletProvider', () => ({
  default: () => ({
    connectWallet: mockConnectWallet,
    swapWallets: mockSwapWallets,
  }),
}));

describe('useConnectToLastUsedWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should connect to source wallet when sourceChain is provided', async () => {
    const sourceChain: Chain = 'Ethereum';

    renderHook(() => useConnectToLastUsedWallet(sourceChain, undefined));

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        sourceChain,
        TransferWallet.SENDING,
        true,
      );
    });
  });

  it('should connect to destination wallet when destChain is provided', async () => {
    const destChain: Chain = 'Solana';

    renderHook(() => useConnectToLastUsedWallet(undefined, destChain));

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        destChain,
        TransferWallet.RECEIVING,
        true,
      );
    });
  });

  it('should connect to both wallets when both chains are provided', async () => {
    const sourceChain: Chain = 'Ethereum';
    const destChain: Chain = 'Solana';

    renderHook(() => useConnectToLastUsedWallet(sourceChain, destChain));

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        sourceChain,
        TransferWallet.SENDING,
        true,
      );
      expect(mockConnectWallet).toHaveBeenCalledWith(
        destChain,
        TransferWallet.RECEIVING,
        true,
      );
      expect(mockConnectWallet).toHaveBeenCalledTimes(2);
    });
  });

  it('should not connect when no chains are provided', () => {
    renderHook(() => useConnectToLastUsedWallet(undefined, undefined));

    expect(mockConnectWallet).not.toHaveBeenCalled();
  });

  it('should return isConnecting as false initially', () => {
    const { result } = renderHook(() =>
      useConnectToLastUsedWallet(undefined, undefined),
    );

    expect(result.current.isConnecting).toBe(false);
  });

  it('should return isConnecting as true when source is connecting', async () => {
    const sourceChain: Chain = 'Ethereum';
    let resolveConnect: (() => void) | undefined;
    const connectPromise = new Promise<void>((resolve) => {
      resolveConnect = resolve;
    });

    mockConnectWallet.mockImplementation(() => connectPromise);

    const { result } = renderHook(() =>
      useConnectToLastUsedWallet(sourceChain, undefined),
    );

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(true);
    });

    resolveConnect?.();

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false);
    });
  });

  it('should return isConnecting as true when destination is connecting', async () => {
    const destChain: Chain = 'Solana';
    let resolveConnect: (() => void) | undefined;
    const connectPromise = new Promise<void>((resolve) => {
      resolveConnect = resolve;
    });

    mockConnectWallet.mockImplementation(() => connectPromise);

    const { result } = renderHook(() =>
      useConnectToLastUsedWallet(undefined, destChain),
    );

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(true);
    });

    resolveConnect?.();

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false);
    });
  });

  it('should return isConnecting as true when either wallet is connecting', async () => {
    const sourceChain: Chain = 'Ethereum';
    const destChain: Chain = 'Solana';
    let resolveSourceConnect: (() => void) | undefined;
    let resolveDestConnect: (() => void) | undefined;

    const sourcePromise = new Promise<void>((resolve) => {
      resolveSourceConnect = resolve;
    });
    const destPromise = new Promise<void>((resolve) => {
      resolveDestConnect = resolve;
    });

    let callCount = 0;
    mockConnectWallet.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? sourcePromise : destPromise;
    });

    const { result } = renderHook(() =>
      useConnectToLastUsedWallet(sourceChain, destChain),
    );

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(true);
    });

    resolveSourceConnect?.();

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(true);
    });

    resolveDestConnect?.();

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false);
    });
  });

  it('should reconnect when sourceChain changes', async () => {
    const sourceChain1: Chain = 'Ethereum';
    const sourceChain2: Chain = 'Polygon';

    const { rerender } = renderHook(
      ({ source }: { source: Chain | undefined }) =>
        useConnectToLastUsedWallet(source, undefined),
      {
        initialProps: { source: sourceChain1 as Chain | undefined },
      },
    );

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        sourceChain1,
        TransferWallet.SENDING,
        true,
      );
    });

    mockConnectWallet.mockClear();

    rerender({ source: sourceChain2 as Chain | undefined });

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        sourceChain2,
        TransferWallet.SENDING,
        true,
      );
    });
  });

  it('should reconnect when destChain changes', async () => {
    const destChain1: Chain = 'Solana';
    const destChain2: Chain = 'Sui';

    const { rerender } = renderHook(
      ({ dest }: { dest: Chain | undefined }) =>
        useConnectToLastUsedWallet(undefined, dest),
      {
        initialProps: { dest: destChain1 as Chain | undefined },
      },
    );

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        destChain1,
        TransferWallet.RECEIVING,
        true,
      );
    });

    mockConnectWallet.mockClear();

    rerender({ dest: destChain2 as Chain | undefined });

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        destChain2,
        TransferWallet.RECEIVING,
        true,
      );
    });
  });

  it('should not update state after unmount', async () => {
    const sourceChain: Chain = 'Ethereum';
    let resolveConnect: (() => void) | undefined;
    const connectPromise = new Promise<void>((resolve) => {
      resolveConnect = resolve;
    });

    mockConnectWallet.mockImplementation(() => connectPromise);

    const { result, unmount } = renderHook(() =>
      useConnectToLastUsedWallet(sourceChain, undefined),
    );

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(true);
    });

    unmount();
    resolveConnect?.();

    // No state update warning should occur
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should handle connectWallet errors gracefully', async () => {
    const sourceChain: Chain = 'Ethereum';

    mockConnectWallet.mockRejectedValue(new Error('Connection failed'));

    const { result } = renderHook(() =>
      useConnectToLastUsedWallet(sourceChain, undefined),
    );

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false);
    });
  });

  it('should not call connectWallet when chain changes from defined to undefined', () => {
    const sourceChain: Chain = 'Ethereum';

    const { rerender } = renderHook(
      ({ source }) => useConnectToLastUsedWallet(source, undefined),
      {
        initialProps: { source: sourceChain as Chain | undefined },
      },
    );

    mockConnectWallet.mockClear();

    rerender({ source: undefined });

    expect(mockConnectWallet).not.toHaveBeenCalled();
  });

  it('should detect swap and call swapWallets when chains swap positions', async () => {
    const sourceChain: Chain = 'Ethereum';
    const destChain: Chain = 'Solana';

    const { rerender } = renderHook(
      ({
        source,
        dest,
      }: {
        source: Chain | undefined;
        dest: Chain | undefined;
      }) => useConnectToLastUsedWallet(source, dest),
      {
        initialProps: {
          source: sourceChain as Chain | undefined,
          dest: destChain as Chain | undefined,
        },
      },
    );

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledTimes(2);
    });

    mockConnectWallet.mockClear();
    mockSwapWallets.mockClear();

    // Swap the chains
    rerender({
      source: destChain as Chain | undefined,
      dest: sourceChain as Chain | undefined,
    });

    await waitFor(() => {
      expect(mockSwapWallets).toHaveBeenCalledTimes(1);
    });

    // Should NOT reconnect wallets during swap
    expect(mockConnectWallet).not.toHaveBeenCalled();
  });

  it('should reconnect normally when chains change individually (not swapped)', async () => {
    const sourceChain1: Chain = 'Ethereum';
    const destChain1: Chain = 'Solana';
    const sourceChain2: Chain = 'Polygon';

    const { rerender } = renderHook(
      ({
        source,
        dest,
      }: {
        source: Chain | undefined;
        dest: Chain | undefined;
      }) => useConnectToLastUsedWallet(source, dest),
      {
        initialProps: {
          source: sourceChain1 as Chain | undefined,
          dest: destChain1 as Chain | undefined,
        },
      },
    );

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledTimes(2);
    });

    mockConnectWallet.mockClear();
    mockSwapWallets.mockClear();

    // Change only source chain (not a swap)
    rerender({
      source: sourceChain2 as Chain | undefined,
      dest: destChain1 as Chain | undefined,
    });

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        sourceChain2,
        TransferWallet.SENDING,
        true,
      );
    });

    // Should NOT call swapWallets
    expect(mockSwapWallets).not.toHaveBeenCalled();
  });

  it('should not call swapWallets on initial mount', async () => {
    const sourceChain: Chain = 'Ethereum';
    const destChain: Chain = 'Solana';

    renderHook(() => useConnectToLastUsedWallet(sourceChain, destChain));

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledTimes(2);
    });

    expect(mockSwapWallets).not.toHaveBeenCalled();
  });

  it('should not call swapWallets when chains swap across different renders', async () => {
    const sourceChain: Chain = 'Ethereum';
    const destChain: Chain = 'Solana';

    const { rerender } = renderHook(
      ({
        source,
        dest,
      }: {
        source: Chain | undefined;
        dest: Chain | undefined;
      }) => useConnectToLastUsedWallet(source, dest),
      {
        initialProps: {
          source: sourceChain as Chain | undefined,
          dest: destChain as Chain | undefined,
        },
      },
    );

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledTimes(2);
    });

    mockConnectWallet.mockClear();
    mockSwapWallets.mockClear();

    // First change: source changes to what dest was
    rerender({
      source: destChain as Chain | undefined,
      dest: destChain as Chain | undefined,
    });

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        destChain,
        TransferWallet.SENDING,
        true,
      );
    });

    mockConnectWallet.mockClear();

    // Second change: dest changes to what source was
    rerender({
      source: destChain as Chain | undefined,
      dest: sourceChain as Chain | undefined,
    });

    await waitFor(() => {
      expect(mockConnectWallet).toHaveBeenCalledWith(
        sourceChain,
        TransferWallet.RECEIVING,
        true,
      );
    });

    // Should NOT call swapWallets because chains didn't swap simultaneously
    expect(mockSwapWallets).not.toHaveBeenCalled();
  });
});
