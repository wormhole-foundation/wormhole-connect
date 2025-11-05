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
  ERR_RELAY_FAILED,
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

// Insufficient funds patterns
export const INSUFFICIENT_FUNDS_FOR_GAS_REGEX =
  /insufficient funds for gas|insufficient.*gas/gim;
export const INSUFFICIENT_FUNDS_REGEX = /insufficient funds/gim;

// Error messages
const INSUFFICIENT_FUNDS_FOR_GAS_ERROR =
  'Insufficient funds for network fees. Please add more funds and try again';
const INSUFFICIENT_FUNDS_ERROR =
  'Insufficient funds for this transfer. Please add more funds and try again';

export function interpretTransferError(
  e: any,
  transferDetails: TransferDetails,
): [string, TransferError] {
  // Fall-back values
  let uiErrorMessage = 'Error with transfer, please try again';
  let internalErrorCode: TransferErrorType = ERR_UNKNOWN;

  if (e.message) {
    if (e instanceof routes.RelayFailedError) {
      uiErrorMessage = e.message;
      internalErrorCode = ERR_RELAY_FAILED;
    } else if (INSUFFICIENT_ALLOWANCE_REGEX.test(e?.message)) {
      uiErrorMessage = 'Error with transfer, please try again';
      internalErrorCode = ERR_INSUFFICIENT_ALLOWANCE;
    } else if (
      e.name === 'TransactionExpiredTimeoutError' ||
      e.name === 'TransactionExpiredBlockheightExceededError'
    ) {
      // Solana timeout
      uiErrorMessage = 'Transfer timed out, please try again';
      internalErrorCode = ERR_TIMEOUT;
    } else if (INSUFFICIENT_FUNDS_FOR_GAS_REGEX.test(e?.message)) {
      uiErrorMessage = INSUFFICIENT_FUNDS_FOR_GAS_ERROR;
      internalErrorCode = ERR_INSUFFICIENT_GAS;
    } else if (INSUFFICIENT_FUNDS_REGEX.test(e?.message)) {
      // IMPORTANT: This check must come after INSUFFICIENT_FUNDS_FOR_GAS_REGEX
      // because "insufficient funds for gas" contains "insufficient funds"
      uiErrorMessage = INSUFFICIENT_FUNDS_ERROR;
      internalErrorCode = ERR_INSUFFICIENT_GAS;
    } else if (USER_REJECTED_REGEX.test(e?.message)) {
      uiErrorMessage = 'Wallet request declined. Transfer not started.';
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
    } else if (
      SIMULATION_ACCOUNT_NOT_FOUND_REGEX.test(e?.message) ||
      INSUFFICIENT_LAMPORTS_REGEX.test(e?.message)
    ) {
      const gasChain = transferDetails.fromChain;
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
