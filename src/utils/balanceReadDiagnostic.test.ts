import { describe, expect, it } from 'vitest';
import {
  formatBalanceReadDiagnostic,
  formatIndexedBalanceReadDiagnostic,
} from './balanceReadDiagnostic';

describe('balance read diagnostics', () => {
  it('identifies Error balance read failures with chain and token key', () => {
    const diagnostic = formatBalanceReadDiagnostic(
      'Ethereum',
      'Ethereum:USDC',
      new Error('RPC request failed'),
    );

    expect(diagnostic).toBe(
      'Balance retrieval/read failure (chain=Ethereum, token=Ethereum:USDC): Error: RPC request failed',
    );
    expect(diagnostic).not.toContain('insufficient balance');
  });

  it('safely formats non-Error thrown values', () => {
    expect(
      formatBalanceReadDiagnostic('Solana', 'Solana:USDC', 'request timed out'),
    ).toBe(
      'Balance retrieval/read failure (chain=Solana, token=Solana:USDC): Non-Error thrown: request timed out',
    );
  });

  it('redacts RPC URLs, credentials, auth values, and wallet addresses', () => {
    const evmWallet = '0x1234567890abcdef1234567890abcdef12345678';
    const solanaWallet = '7YttLkHDoNj9wyDur5CVeLjJYF9aL7U9HkY7Q9xHXGgZ';
    const nearWallet = 'private-wallet.near';
    const diagnostic = formatBalanceReadDiagnostic(
      'Ethereum',
      'Ethereum:USDC',
      new Error(
        `request to https://rpc.example/v1/${evmWallet}?apiKey=rpc-secret&auth=session-secret failed for wallet=${solanaWallet}; address=${nearWallet}; token=loose-secret; Authorization: Bearer bearer-secret`,
      ),
    );

    expect(diagnostic).toContain('[REDACTED_URL]');
    expect(diagnostic).toContain('wallet=[REDACTED_ADDRESS]');
    expect(diagnostic).toContain('Authorization: [REDACTED]');
    expect(diagnostic).not.toContain('rpc.example');
    expect(diagnostic).not.toContain('rpc-secret');
    expect(diagnostic).not.toContain('session-secret');
    expect(diagnostic).not.toContain('bearer-secret');
    expect(diagnostic).not.toContain('loose-secret');
    expect(diagnostic).not.toContain(evmWallet);
    expect(diagnostic).not.toContain(solanaWallet);
    expect(diagnostic).not.toContain(nearWallet);
  });

  it('makes the indexed fallback visible without exposing its raw error', () => {
    const diagnostic = formatIndexedBalanceReadDiagnostic(
      'Ethereum',
      'failed at wss://rpc.example/socket?access_token=socket-secret',
    );

    expect(diagnostic).toBe(
      'Indexed balance retrieval failure (chain=Ethereum); falling back to per-token reads: Non-Error thrown: failed at [REDACTED_URL]',
    );
  });
});
