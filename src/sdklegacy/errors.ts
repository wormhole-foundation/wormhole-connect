export class TokenNotSupportedForRelayError extends Error {
  static MESSAGE = 'Token not supported for relay';
  constructor() {
    super(TokenNotSupportedForRelayError.MESSAGE);
  }
}

export class TokenNotRegisteredError extends Error {
  static MESSAGE = 'Token not registered';
  constructor() {
    super(TokenNotRegisteredError.MESSAGE);
  }
}

export class InsufficientFundsForGasError extends Error {
  static MESSAGE = 'Insufficient funds for gas';
  static MESSAGE_REGEX = /insufficient funds|Insufficient funds for gas/gm;
  constructor() {
    super(InsufficientFundsForGasError.MESSAGE);
  }
}
