import type { TransferErrorType, TransferError } from 'telemetry/types';
import {
  ERR_INSUFFICIENT_ALLOWANCE,
  ERR_SWAP_FAILED,
  ERR_INSUFFICIENT_GAS,
  ERR_TIMEOUT,
  ERR_UNKNOWN,
  ERR_USER_REJECTED,
} from 'telemetry/types';
import { ChainName, InsufficientFundsForGasError } from 'sdklegacy';
import { SWAP_ERROR } from 'routes/porticoBridge/consts';

// TODO SDKV2
// copied from sdk subpackage
export const INSUFFICIENT_ALLOWANCE = 'Insufficient token allowance';

export function interpretTransferError(
  e: any,
  chain: ChainName,
): [string, TransferError] {
  // Fall-back values
  let uiErrorMessage = 'Error with transfer, please try again';
  let internalErrorCode: TransferErrorType = ERR_UNKNOWN;

  if (e.message) {
    if (e.message === INSUFFICIENT_ALLOWANCE) {
      uiErrorMessage = 'Error with transfer, please try again';
      internalErrorCode = ERR_INSUFFICIENT_ALLOWANCE;
    } else if (e.name === 'TransactionExpiredTimeoutError') {
      // Solana timeout
      uiErrorMessage = 'Transfer timed out, please try again';
      internalErrorCode = ERR_TIMEOUT;
    } else if (e?.message === InsufficientFundsForGasError.MESSAGE) {
      uiErrorMessage = e.message;
      internalErrorCode = ERR_INSUFFICIENT_GAS;
    } else if (e.message.includes('rejected the request')) {
      uiErrorMessage = 'Transfer rejected in wallet, please try again';
      internalErrorCode = ERR_USER_REJECTED;
    } else if (e.message === SWAP_ERROR) {
      uiErrorMessage = SWAP_ERROR;
      internalErrorCode = ERR_SWAP_FAILED;
    }
  }

  return [uiErrorMessage, { type: internalErrorCode, original: e }];
}
