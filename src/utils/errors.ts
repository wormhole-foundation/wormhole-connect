import type {
  TransferErrorType,
  TransferError,
  TransferDetails,
} from 'telemetry/types';
import {
  ERR_INSUFFICIENT_ALLOWANCE,
  ERR_INSUFFICIENT_GAS,
  ERR_INSUFFICIENT_FUNDS,
  ERR_TIMEOUT,
  ERR_UNKNOWN,
  ERR_USER_REJECTED,
  ERR_AMOUNT_TOO_LARGE,
  ERR_AMOUNT_TOO_SMALL,
  ERR_RELAY_FAILED,
  ERR_SLIPPAGE_EXCEEDED,
} from 'telemetry/types';
import { routes, amount as sdkAmount } from '@wormhole-foundation/sdk';
import {
  chainDisplayName,
  getGasToken,
  getTokenDisplaySymbolByTokenAddress,
} from 'utils';

// TODO SDKV2
// attempt to capture errors using regex
export const INSUFFICIENT_ALLOWANCE_REGEX = /insufficient token allowance/im;
export const INSUFFICIENT_LAMPORTS_REGEX =
  /insufficient lamports.*?(\d+).*?(\d+)/im;
export const SIMULATION_ACCOUNT_NOT_FOUND_REGEX =
  /simulation failed:.*accountnotfound/i;
export const USER_REJECTED_REGEX = new RegExp(
  'user rejected|rejected the request|rejected from user|user cancel|aborted by user|plugin closed|denied request signature|user denied|action_rejected|ethers-user-denied|approval denied',
  'mi',
);
export const AMOUNT_IN_TOO_SMALL = new RegExp('AmountInTooSmall', 'm');
export const JUPITER_SLIPPAGE_ERROR =
  /Simulation failed:.*InstructionError.*Custom.*6001/;

// Insufficient funds patterns
export const INSUFFICIENT_FUNDS_FOR_GAS_REGEX =
  /insufficient.*(gas|fee|lamports|rent|intrinsic|settlement)/gi;
export const INSUFFICIENT_FUNDS_REGEX = /insufficient (funds|balance)/gi;

// Error messages
const INSUFFICIENT_FUNDS_FOR_GAS_ERROR =
  'Insufficient gas for this transfer. Please add more gas and try again';
const INSUFFICIENT_FUNDS_ERROR =
  'Insufficient funds for this transfer. Please add more funds and try again';

// Helper function to check if a regex matches in various nested error locations
// Different wallets and libraries nest error messages in different places:
// - e.message (most common)
// - e.info?.error?.message (seen in Monad transactions)
// - e.info?.error?.data?.message (ethers.js wrapping MetaMask errors)
function errorMessageMatches(e: any, regex: RegExp): boolean {
  return (
    regex.test(e?.message) ||
    regex.test(e?.info?.error?.message) ||
    regex.test(e?.info?.error?.data?.message)
  );
}

export function interpretTransferError(
  e: any,
  transferDetails: TransferDetails,
  context: 'send' | 'redeem',
): [string, TransferError] {
  // Fall-back values
  let uiErrorMessage = 'Error with transfer, please try again';
  let internalErrorCode: TransferErrorType = ERR_UNKNOWN;

  if (e.message) {
    if (e instanceof routes.RelayFailedError) {
      uiErrorMessage = e.message;
      internalErrorCode = ERR_RELAY_FAILED;
    } else if (
      transferDetails.route.includes('MayanSwapMONOCHAIN') &&
      errorMessageMatches(e, JUPITER_SLIPPAGE_ERROR)
    ) {
      uiErrorMessage = 'Slippage exceeded. Please try again';
      internalErrorCode = ERR_SLIPPAGE_EXCEEDED;
    } else if (errorMessageMatches(e, INSUFFICIENT_ALLOWANCE_REGEX)) {
      uiErrorMessage = 'Error with transfer, please try again';
      internalErrorCode = ERR_INSUFFICIENT_ALLOWANCE;
    } else if (
      e.name === 'TransactionExpiredTimeoutError' ||
      e.name === 'TransactionExpiredBlockheightExceededError'
    ) {
      // Solana timeout
      uiErrorMessage = 'Transfer timed out, please try again';
      internalErrorCode = ERR_TIMEOUT;
    } else if (errorMessageMatches(e, INSUFFICIENT_FUNDS_FOR_GAS_REGEX)) {
      uiErrorMessage = INSUFFICIENT_FUNDS_FOR_GAS_ERROR;
      internalErrorCode = ERR_INSUFFICIENT_GAS;
    } else if (errorMessageMatches(e, INSUFFICIENT_FUNDS_REGEX)) {
      // IMPORTANT: This check must come after INSUFFICIENT_FUNDS_FOR_GAS_REGEX
      // because "insufficient funds for gas" contains "insufficient funds"
      uiErrorMessage = INSUFFICIENT_FUNDS_ERROR;
      internalErrorCode = ERR_INSUFFICIENT_FUNDS;
    } else if (errorMessageMatches(e, USER_REJECTED_REGEX)) {
      uiErrorMessage = 'Wallet request declined. Transfer not started.';
      internalErrorCode = ERR_USER_REJECTED;
    } else if (errorMessageMatches(e, AMOUNT_IN_TOO_SMALL)) {
      uiErrorMessage = 'Amount is too small for the selected route';
      internalErrorCode = ERR_AMOUNT_TOO_SMALL;
    } else if (
      transferDetails.route.includes('CCTP') &&
      /burn.*exceed/i.test(e?.toString())
    ) {
      // As of this code being written the CCTP limit is 10,000,000 USDC in a single transfer
      // It's possible Circle could change this in the future and we're not reading the limit
      // from their contracts dynamically for now so we assume it's 1M and tell users that if
      // their amount exceeded 1M
      const assumedCircleLimit = 1_000_000;
      const { amount } = transferDetails;
      const limitString =
        amount !== undefined && sdkAmount.whole(amount) > assumedCircleLimit
          ? ` of 10,000,000`
          : '';
      uiErrorMessage = `Amount exceeds Circle limit${limitString}. Please reduce transfer amount.`;
      internalErrorCode = ERR_AMOUNT_TOO_LARGE;
    } else if (
      errorMessageMatches(e, SIMULATION_ACCOUNT_NOT_FOUND_REGEX) ||
      errorMessageMatches(e, INSUFFICIENT_LAMPORTS_REGEX)
    ) {
      // Determine which chain needs gas based on context
      // - 'send': gas needed on source chain (where send transaction happens)
      // - 'redeem': gas needed on destination chain (where redeem transaction happens)
      const gasChain =
        context === 'send'
          ? transferDetails.fromChain
          : transferDetails.toChain;

      try {
        const gasToken = getGasToken(gasChain);
        const gasSymbol = getTokenDisplaySymbolByTokenAddress(gasToken);
        const chainName = chainDisplayName(gasChain);
        const chainSuffix = chainName ? ` on ${chainName}` : '';
        uiErrorMessage = `Insufficient ${gasSymbol} for fees${chainSuffix}. Please add more ${gasSymbol} and try again`;
      } catch {
        uiErrorMessage = INSUFFICIENT_FUNDS_FOR_GAS_ERROR;
      }
      internalErrorCode = ERR_INSUFFICIENT_GAS;
    }
  }

  return [uiErrorMessage, { type: internalErrorCode, original: e }];
}

export function maybeLogSdkError(e: any, prefix?: string) {
  if (e instanceof Error && e.message.startsWith('No protocols registered for'))
    return;

  console.error(prefix ? `${prefix}: ${e}` : e);
}

// Normalizes an unknown error into a short, single-line message that is safe
// to log: RPC URLs, wallet addresses, and credential-like values are redacted
// and request headers are never read in the first place.
const SAFE_ERROR_REDACTED = '[redacted]';
const SAFE_ERROR_MAX_LENGTH = 200;

export function normalizeBalanceFetchError(e: unknown): string {
  let message: string;
  if (e instanceof Error) {
    message = e.message;
  } else if (typeof e === 'string') {
    message = e;
  } else if (e && typeof (e as { message?: unknown }).message === 'string') {
    message = (e as { message: string }).message;
  } else if (e == null) {
    return 'unknown error';
  } else {
    try {
      message = String(e);
    } catch {
      return 'unknown error';
    }
  }

  message = message
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/https?:\/\/\S+/gi, SAFE_ERROR_REDACTED)
    .replace(/\b0x[0-9a-fA-F]{40}\b/g, SAFE_ERROR_REDACTED)
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{43,44}\b/g, SAFE_ERROR_REDACTED)
    .replace(
      /(api[-_]?key|secret|password|authorization|bearer)(\s*[=:]\s*)\S+/gi,
      `$1$2${SAFE_ERROR_REDACTED}`,
    );

  if (message.length > SAFE_ERROR_MAX_LENGTH) {
    message = `${message.slice(0, SAFE_ERROR_MAX_LENGTH)}...`;
  }
  return message || 'unknown error';
}
