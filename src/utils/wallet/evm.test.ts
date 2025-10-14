import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signAndSendTransaction } from './evm';
import type { EvmUnsignedTransaction } from '@wormhole-foundation/sdk-evm';
import type { Network } from '@wormhole-foundation/sdk';

describe('signAndSendTransaction', () => {
  const mockWallet = {
    getSigner: vi.fn(),
    switchChain: vi.fn(),
  };

  const mockSigner = {
    provider: {
      getNetwork: vi.fn(),
    },
    estimateGas: vi.fn(),
    sendTransaction: vi.fn(),
  };

  const mockTx = {
    wait: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call estimateGas and add 30% buffer for CreditCoin transactions', async () => {
    const request = {
      chain: 'CreditCoin',
      transaction: {
        chainId: 102031,
        data: '0x',
        to: '0x123',
        value: 0n,
      },
    } as EvmUnsignedTransaction<Network, any>;

    const expectedGasLimit = 100000n;
    const expectedBufferedGasLimit = (expectedGasLimit * 130n) / 100n;

    mockWallet.getSigner.mockResolvedValue(mockSigner);
    mockSigner.provider.getNetwork.mockResolvedValue({ chainId: 102031n });
    mockSigner.estimateGas.mockResolvedValue(expectedGasLimit);
    mockSigner.sendTransaction.mockResolvedValue(mockTx);
    mockTx.wait.mockResolvedValue({ hash: '0xabc123' });

    const result = await signAndSendTransaction(
      request,
      mockWallet as any,
      'CreditCoin',
    );

    expect(mockSigner.estimateGas).toHaveBeenCalledWith(request.transaction);
    expect(mockSigner.sendTransaction).toHaveBeenCalledWith({
      ...request.transaction,
      gasLimit: expectedBufferedGasLimit,
    });
    expect(result).toBe('0xabc123');
  });
});
