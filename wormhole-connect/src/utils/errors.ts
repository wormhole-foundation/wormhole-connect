import type {
  TransferErrorType,
  TransferError,
  TransferDetails,
} from 'telemetry/types';
import {
  ERR_INSUFFICIENT_ALLOWANCE,
  ERR_INSUFFICIENT_GAS,
  ERR_TIMEOUT,
  ERR_UNKNOWN,
  ERR_USER_REJECTED,
  ERR_AMOUNT_TOO_LARGE,
  ERR_AMOUNT_TOO_SMALL,
} from 'telemetry/types';
import { InsufficientFundsForGasError } from 'sdklegacy';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

// TODO SDKV2
// attempt to capture errors using regex
export const INSUFFICIENT_ALLOWANCE_REGEX = /insufficient token allowance/im;
export const USER_REJECTED_REGEX = new RegExp(
  'user rejected|rejected the request|rejected from user|user cancel|aborted by user|plugin closed',
  'mi',
);
export const AMOUNT_IN_TOO_SMALL = new RegExp('AmountInTooSmall', 'm');

export function interpretTransferError(
  e: any,
  transferDetails: TransferDetails,
  isHyperliquidTransfer = false,
): [string, TransferError] {
  // Fall-back values
  let uiErrorMessage = isHyperliquidTransfer
    ? 'Hyperliquid deposit error. USDC has been deposited in your wallet on Arbitrum'
    : 'Error with transfer, please try again';
  let internalErrorCode: TransferErrorType = ERR_UNKNOWN;

  if (e.message) {
    if (INSUFFICIENT_ALLOWANCE_REGEX.test(e?.message)) {
      uiErrorMessage = 'Error with transfer, please try again';
      internalErrorCode = ERR_INSUFFICIENT_ALLOWANCE;
    } else if (
      e.name === 'TransactionExpiredTimeoutError' ||
      e.name === 'TransactionExpiredBlockheightExceededError'
    ) {
      // Solana timeout
      uiErrorMessage = 'Transfer timed out, please try again';
      internalErrorCode = ERR_TIMEOUT;
    } else if (InsufficientFundsForGasError.MESSAGE_REGEX.test(e?.message)) {
      uiErrorMessage = 'Insufficient funds';
      internalErrorCode = ERR_INSUFFICIENT_GAS;
    } else if (USER_REJECTED_REGEX.test(e?.message)) {
      uiErrorMessage = 'Transfer rejected in wallet, please try again';
      internalErrorCode = ERR_USER_REJECTED;
    } else if (AMOUNT_IN_TOO_SMALL.test(e?.message)) {
      uiErrorMessage = 'Amount is too small for the selected route';
      internalErrorCode = ERR_AMOUNT_TOO_SMALL;
    } else if (
      transferDetails.route.includes('CCTP') &&
      /burn.*exceed/i.test(e?.toString())
    ) {
      // As of this code being written the CCTP limit is 1,000,000 USDC in a single transfer
      // It's possible Circle could change this in the future and we're not reading the limit
      // from their contracts dynamically for now so we assume it's 1M and tell users that if
      // their amount exceeded 1M
      const assumedCircleLimit = 1_000_000;
      const { amount } = transferDetails;
      const limitString =
        amount !== undefined && sdkAmount.whole(amount) > assumedCircleLimit
          ? ` of 1,000,000`
          : '';
      uiErrorMessage = `Amount exceeds Circle limit${limitString}. Please reduce transfer amount.`;
      internalErrorCode = ERR_AMOUNT_TOO_LARGE;
    }
  }

  return [uiErrorMessage, { type: internalErrorCode, original: e }];
}

export function maybeLogSdkError(e: any, prefix?: string) {
  if (e instanceof Error && e.message.startsWith('No protocols registered for'))
    return;

  console.error(prefix ? `${prefix}: ${e}` : e);
}
