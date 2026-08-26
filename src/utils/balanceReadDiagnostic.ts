import type { Chain } from '@wormhole-foundation/sdk';

const MAX_ERROR_LENGTH = 500;

const getThrownValue = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name || 'Error'}: ${error.message}`;
  }

  if (typeof error === 'object' && error !== null) {
    try {
      const message = Reflect.get(error, 'message');
      if (typeof message === 'string') {
        return `Non-Error thrown: ${message}`;
      }
    } catch {
      // Avoid invoking untrusted getters again while formatting diagnostics.
    }

    return 'Non-Error thrown: [object]';
  }

  return `Non-Error thrown: ${String(error)}`;
};

const sanitizeError = (error: unknown): string =>
  getThrownValue(error)
    .replace(/\b(?:https?|wss?):\/\/[^\s<>"'`]+/gi, '[REDACTED_URL]')
    .replace(
      /\b(?:authorization|proxy-authorization)\s*[:=]\s*(?:(?:bearer|basic)\s+)?[^\s,;]+/gi,
      'Authorization: [REDACTED]',
    )
    .replace(/\b(?:bearer|basic)\s+[^\s,;]+/gi, '[REDACTED]')
    .replace(
      /\b(api[-_]?key|access[-_]?token|auth(?:orization)?|client[-_]?secret|credential|key|password|project[-_]?id|secret|signature|token)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s&,;]+)/gi,
      '$1$2[REDACTED]',
    )
    .replace(
      /\b(wallet(?:address)?|address|account|owner)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1$2[REDACTED_ADDRESS]',
    )
    .replace(/\b0x[a-f\d]{40,64}\b/gi, '[REDACTED_ADDRESS]')
    .replace(/\b[a-z\d]{2,15}1[ac-hj-np-z02-9]{20,}\b/gi, '[REDACTED_ADDRESS]')
    .replace(/\b[a-z\d_-]{2,64}\.(?:near|testnet)\b/gi, '[REDACTED_ADDRESS]')
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{25,64}\b/g, '[REDACTED_ADDRESS]')
    .replace(/\b[A-Za-z\d+/_=-]{24,}\b/g, '[REDACTED_IDENTIFIER]')
    .slice(0, MAX_ERROR_LENGTH);

export const formatBalanceReadDiagnostic = (
  chain: Chain,
  tokenKey: string,
  error: unknown,
): string =>
  `Balance retrieval/read failure (chain=${chain}, token=${tokenKey}): ${sanitizeError(
    error,
  )}`;

export const formatIndexedBalanceReadDiagnostic = (
  chain: Chain,
  error: unknown,
): string =>
  `Indexed balance retrieval failure (chain=${chain}); falling back to per-token reads: ${sanitizeError(
    error,
  )}`;
