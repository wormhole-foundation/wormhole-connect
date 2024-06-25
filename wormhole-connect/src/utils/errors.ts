import config from 'config';
import type { TransferErrorType, TransferError } from 'telemetry/types';
import {
  ERR_INSUFFICIENT_ALLOWANCE,
  ERR_SWAP_FAILED,
  ERR_NOT_ENOUGH_CAPACITY,
  ERR_SOURCE_CONTRACT_PAUSED,
  ERR_DESTINATION_CONTRACT_PAUSED,
  ERR_UNSUPPORTED_ABI_VERSION,
  ERR_INSUFFICIENT_GAS,
  ERR_TIMEOUT,
  ERR_UNKNOWN,
  ERR_USER_REJECTED,
} from 'telemetry/types';
import {
  ChainName,
  InsufficientFundsForGasError,
} from '@wormhole-foundation/wormhole-connect-sdk';
import {
  DestinationContractIsPausedError,
  NotEnoughCapacityError,
  ContractIsPausedError,
  UnsupportedContractAbiVersion,
} from 'routes/ntt/errors';
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
    } else if (e?.message === NotEnoughCapacityError.MESSAGE) {
      uiErrorMessage = `This transfer would be rate-limited due to high volume on ${config.chains[chain]?.displayName}, please try again later`;
      internalErrorCode = ERR_NOT_ENOUGH_CAPACITY;
    } else if (e?.message === ContractIsPausedError.MESSAGE) {
      uiErrorMessage = e.message;
      internalErrorCode = ERR_SOURCE_CONTRACT_PAUSED;
    } else if (e?.message === DestinationContractIsPausedError.MESSAGE) {
      uiErrorMessage = e.message;
      internalErrorCode = ERR_DESTINATION_CONTRACT_PAUSED;
    } else if (e?.message === UnsupportedContractAbiVersion.MESSAGE) {
      uiErrorMessage = 'Unsupported contract ABI version';
      internalErrorCode = ERR_UNSUPPORTED_ABI_VERSION;
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
