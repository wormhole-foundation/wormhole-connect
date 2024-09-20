import type { TransferErrorType, TransferError } from 'telemetry/types';
import {
  ERR_INSUFFICIENT_ALLOWANCE,
  ERR_INSUFFICIENT_GAS,
  ERR_TIMEOUT,
  ERR_UNKNOWN,
  ERR_USER_REJECTED,
} from 'telemetry/types';
import { InsufficientFundsForGasError } from 'sdklegacy';
import { Chain } from '@wormhole-foundation/sdk';

export function interpretTransferError(
  e: any,
  chain: Chain,
): [string, TransferError] {
  // TODO SDKV2
  // attempt to capture errors using regex
  const INSUFFICIENT_ALLOWANCE_REGEX = /[I|i]nsufficient token allowance/gm;
  const USER_REJECTED_REGEX =
    /rejected the request|[R|r]ejected from user|user cancel|aborted by user|user rejected action/gm;

  const internalErrorCode: TransferErrorType = (() => {
    if (USER_REJECTED_REGEX.test(e?.message)) return ERR_USER_REJECTED;
    if (INSUFFICIENT_ALLOWANCE_REGEX.test(e?.message)) {
      return ERR_INSUFFICIENT_ALLOWANCE;
    }
    if (InsufficientFundsForGasError.MESSAGE_REGEX.test(e?.message)) {
      return ERR_INSUFFICIENT_GAS;
    }
    if (e?.name === 'TransactionExpiredTimeoutError') {
      return ERR_TIMEOUT; // Solana timeout
    }
    return ERR_UNKNOWN;
  })();

  const genericMessage = 'Error with transfer, please try again';
  const uiErrorMessage: string =
    {
      [ERR_INSUFFICIENT_GAS]: e?.message,
      [ERR_TIMEOUT]: 'Transfer timed out, please try again',
      [ERR_USER_REJECTED]: 'Transfer rejected in wallet, please try again',
    }[internalErrorCode] || genericMessage;

  return [uiErrorMessage, { type: internalErrorCode, original: e }];
}
